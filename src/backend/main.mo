import Int "mo:core/Int";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Component Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type CourseId = Nat;
  type LessonId = Nat;
  type QuizId = Nat;
  type QuestionId = Nat;

  public type UserProfile = {
    name : Text;
    role : Text; // "Admin", "Instructor", "Student"
  };

  public type Course = {
    id : CourseId;
    title : Text;
    description : Text;
    category : Text;
    instructor : Principal;
    createdAt : Time.Time;
  };

  public type Lesson = {
    id : LessonId;
    courseId : CourseId;
    title : Text;
    content : Text;
    order : Nat;
    createdAt : Time.Time;
  };

  public type Question = {
    id : QuestionId;
    questionText : Text;
    options : [Text];
    correctOptionIndex : Nat;
  };

  public type Quiz = {
    id : QuizId;
    lessonId : LessonId;
    questions : [Question];
  };

  public type Enrollment = {
    student : Principal;
    courseId : CourseId;
    enrolledAt : Time.Time;
  };

  public type LessonCompletion = {
    student : Principal;
    lessonId : LessonId;
    completedAt : Time.Time;
  };

  public type QuizAttempt = {
    student : Principal;
    quizId : QuizId;
    score : Nat;
    attempts : Nat;
    completedAt : Time.Time;
  };

  // State
  var courseIdCounter = 0;
  var lessonIdCounter = 0;
  var quizIdCounter = 0;
  var questionIdCounter = 0;

  let courses = Map.empty<CourseId, Course>();
  let lessons = Map.empty<LessonId, Lesson>();
  let quizzes = Map.empty<QuizId, Quiz>();

  let enrollments = List.empty<Enrollment>();

  let lessonCompletions = List.empty<LessonCompletion>();
  let quizAttempts = List.empty<QuizAttempt>();

  let userProfiles = Map.empty<Principal, UserProfile>();

  module Course {
    public func compare(course1 : Course, course2 : Course) : Order.Order {
      Nat.compare(course1.id, course2.id);
    };
  };

  module Lesson {
    public func compare(lesson1 : Lesson, lesson2 : Lesson) : Order.Order {
      switch (Nat.compare(lesson1.courseId, lesson2.courseId)) {
        case (#equal) {
          Nat.compare(lesson1.order, lesson2.order);
        };
        case (order) { order };
      };
    };

    public func equal(lesson1 : Lesson, lesson2 : Lesson) : Bool {
      lesson1.id == lesson2.id;
    };
  };

  module LessonCompletion {
    public func compare(a : LessonCompletion, b : LessonCompletion) : Order.Order {
      switch (Nat.compare(a.lessonId, b.lessonId)) {
        case (#equal) {
          switch (Principal.compare(a.student, b.student)) {
            case (#equal) { Int.compare(a.completedAt, b.completedAt) };
            case (order) { order };
          };
        };
        case (order) { order };
      };
    };
  };

  module QuizAttempt {
    public func compare(a : QuizAttempt, b : QuizAttempt) : Order.Order {
      Nat.compare(a.quizId, b.quizId);
    };

    public func equal(a : QuizAttempt, b : QuizAttempt) : Bool {
      a.quizId == b.quizId and a.student == b.student;
    };
  };

  module Enrollment {
    public func compare(a : Enrollment, b : Enrollment) : Order.Order {
      switch (Nat.compare(a.courseId, b.courseId)) {
        case (#equal) { Principal.compare(a.student, b.student) };
        case (order) { order };
      };
    };

    public func equal(a : Enrollment, b : Enrollment) : Bool {
      a.courseId == b.courseId and a.student == b.student;
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Helper functions
  func isEnrolledInternal(student : Principal, courseId : CourseId) : Bool {
    enrollments.toArray().find(
      func(e) { e.student == student and e.courseId == courseId }
    ) != null;
  };

  func isCourseInstructor(caller : Principal, courseId : CourseId) : Bool {
    switch (courses.get(courseId)) {
      case (null) { false };
      case (?course) { course.instructor == caller };
    };
  };

  // Course Management
  public shared ({ caller }) func createCourse(title : Text, description : Text, category : Text) : async CourseId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create a course");
    };
    courseIdCounter += 1;
    let courseId = courseIdCounter;

    let course : Course = {
      id = courseId;
      title;
      description;
      category;
      instructor = caller;
      createdAt = Time.now();
    };

    courses.add(courseId, course);
    courseId;
  };

  public shared ({ caller }) func updateCourse(courseId : CourseId, title : Text, description : Text, category : Text) : async () {
    let course = switch (courses.get(courseId)) {
      case (null) { Runtime.trap("Course does not exist") };
      case (?course) {
        if (course.instructor != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the course instructor or an admin can update this course");
        };
        { course with title; description; category };
      };
    };
    courses.add(courseId, course);
  };

  public shared ({ caller }) func deleteCourse(courseId : CourseId) : async () {
    switch (courses.get(courseId)) {
      case (null) { Runtime.trap("Course does not exist") };
      case (?course) {
        if (course.instructor != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized: Only the course instructor or an admin can delete this course");
        };
        courses.remove(courseId);
      };
    };
  };

  public query ({ caller }) func getCourse(courseId : CourseId) : async Course {
    switch (courses.get(courseId)) {
      case (null) { Runtime.trap("Course does not exist") };
      case (?course) { course };
    };
  };

  public query ({ caller }) func listCourses() : async [Course] {
    courses.values().toArray().sort();
  };

  // Lesson Management
  public shared ({ caller }) func createLesson(courseId : CourseId, title : Text, content : Text, order : Nat) : async LessonId {
    let course = switch (courses.get(courseId)) {
      case (null) { Runtime.trap("Course does not exist") };
      case (?course) { course };
    };

    if (course.instructor != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only the course instructor or an admin can create a lesson");
    };
    lessonIdCounter += 1;
    let lessonId = lessonIdCounter;

    let lesson : Lesson = {
      id = lessonId;
      courseId;
      title;
      content;
      order;
      createdAt = Time.now();
    };

    lessons.add(lessonId, lesson);
    lessonId;
  };

  public shared ({ caller }) func updateLesson(lessonId : LessonId, title : Text, content : Text, order : Nat) : async () {
    let lesson = switch (lessons.get(lessonId)) {
      case (null) { Runtime.trap("Lesson does not exist") };
      case (?lesson) {
        let course = switch (courses.get(lesson.courseId)) {
          case (null) { Runtime.trap("Course does not exist - corrupted lesson") };
          case (?course) {
            if (course.instructor != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Only the course instructor or an admin can update this lesson");
            };
            { lesson with title; content; order };
          };
        };
      };
    };
    lessons.add(lessonId, lesson);
  };

  public shared ({ caller }) func deleteLesson(lessonId : LessonId) : async () {
    switch (lessons.get(lessonId)) {
      case (null) { Runtime.trap("Lesson does not exist") };
      case (?lesson) {
        let course = switch (courses.get(lesson.courseId)) {
          case (null) { Runtime.trap("Course does not exist - corrupted lesson") };
          case (?course) {
            if (course.instructor != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Only the course instructor or an admin can delete this lesson");
            };
            lessons.remove(lessonId);
          };
        };
      };
    };
  };

  public query ({ caller }) func getLesson(lessonId : LessonId) : async Lesson {
    switch (lessons.get(lessonId)) {
      case (null) { Runtime.trap("Lesson does not exist") };
      case (?lesson) {
        // Verify caller is enrolled in the course or is instructor/admin
        if (not isEnrolledInternal(caller, lesson.courseId) and 
            not isCourseInstructor(caller, lesson.courseId) and 
            not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Must be enrolled in course to view lesson");
        };
        lesson;
      };
    };
  };

  public query ({ caller }) func listCourseLessons(courseId : CourseId) : async [Lesson] {
    // Verify caller is enrolled in the course or is instructor/admin
    if (not isEnrolledInternal(caller, courseId) and 
        not isCourseInstructor(caller, courseId) and 
        not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Must be enrolled in course to view lessons");
    };
    
    lessons.values().toArray().filter(
      func(lesson) { lesson.courseId == courseId }
    ).sort();
  };

  // Enrollment Management
  public shared ({ caller }) func enrollInCourse(courseId : CourseId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can enroll in courses");
    };
    
    switch (courses.get(courseId)) {
      case (null) { Runtime.trap("Course does not exist") };
      case (?course) {
        if (course.instructor == caller) {
          Runtime.trap("Instructor cannot enroll in own course");
        } else if (isEnrolledInternal(caller, courseId)) {
          Runtime.trap("Already enrolled in course");
        } else {
          let enrollment : Enrollment = {
            student = caller;
            courseId;
            enrolledAt = Time.now();
          };
          enrollments.add(enrollment);
        };
      };
    };
  };

  public shared ({ caller }) func unenrollFromCourse(courseId : CourseId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unenroll from courses");
    };
    
    if (not isEnrolledInternal(caller, courseId)) {
      Runtime.trap("Not enrolled in course");
    };

    let filteredEnrollments = enrollments.toArray().filter(
      func(e) { not (e.student == caller and e.courseId == courseId) }
    );

    enrollments.clear();
    filteredEnrollments.values().forEach(func(e) { enrollments.add(e) });
  };

  public query ({ caller }) func isEnrolled(student : Principal, courseId : CourseId) : async Bool {
    // Allow checking own enrollment, or instructor/admin checking any enrollment
    if (caller != student and 
        not isCourseInstructor(caller, courseId) and 
        not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only check your own enrollment status");
    };
    isEnrolledInternal(student, courseId);
  };

  public query ({ caller }) func getEnrolledCourses(student : Principal) : async [CourseId] {
    // Allow viewing own enrollments, or admin viewing any
    if (caller != student and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own enrolled courses");
    };
    
    enrollments.toArray().filter(
      func(e) { e.student == student }
    ).map(func(e) { e.courseId });
  };

  public query ({ caller }) func getCourseStudents(courseId : CourseId) : async [Principal] {
    // Only instructor of course or admin can view enrolled students
    if (not isCourseInstructor(caller, courseId) and 
        not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only course instructor or admin can view enrolled students");
    };
    
    enrollments.toArray().filter(
      func(e) { e.courseId == courseId }
    ).map(func(e) { e.student });
  };

  // Lesson Completion
  public shared ({ caller }) func completeLesson(lessonId : LessonId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete lessons");
    };
    
    switch (lessons.get(lessonId)) {
      case (null) { Runtime.trap("Lesson does not exist") };
      case (?lesson) {
        if (not isEnrolledInternal(caller, lesson.courseId)) {
          Runtime.trap("Unauthorized: Not enrolled in course");
        };

        let completion : LessonCompletion = {
          student = caller;
          lessonId;
          completedAt = Time.now();
        };

        let filteredCompletions = lessonCompletions.toArray().filter(
          func(c) { not (c.student == caller and c.lessonId == lessonId) }
        );

        lessonCompletions.clear();
        filteredCompletions.values().forEach(func(c) { lessonCompletions.add(c) });
        lessonCompletions.add(completion);
      };
    };
  };

  public query ({ caller }) func isLessonCompleted(student : Principal, lessonId : LessonId) : async Bool {
    // Allow checking own completion, or instructor/admin checking any
    let lesson = switch (lessons.get(lessonId)) {
      case (null) { Runtime.trap("Lesson does not exist") };
      case (?lesson) { lesson };
    };
    
    if (caller != student and 
        not isCourseInstructor(caller, lesson.courseId) and 
        not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only check your own lesson completion");
    };
    
    lessonCompletions.toArray().find(
      func(completion) { completion.student == student and completion.lessonId == lessonId;}
    ) != null;
  };

  public query ({ caller }) func getCourseCompletion(student : Principal, courseId : CourseId) : async Nat {
    // Allow checking own completion, or instructor/admin checking any
    if (caller != student and 
        not isCourseInstructor(caller, courseId) and 
        not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only check your own course completion");
    };
    
    let courseLessons = lessons.values().toArray().filter(
      func(lesson) { lesson.courseId == courseId }
    );
    let totalLessons = courseLessons.size();

    if (totalLessons == 0) { return 0 };

    let completedLessons = courseLessons.foldLeft(
      0,
      func(acc, lesson) {
        switch (lessonCompletions.toArray().find(
          func(completion) {
            completion.student == student and completion.lessonId == lesson.id;
          }
        )) {
          case (null) { acc };
          case (?_) { acc + 1 };
        };
      },
    );

    (completedLessons * 100) / totalLessons;
  };

  public query ({ caller }) func getCourseLessonCompletions(student : Principal, courseId : CourseId) : async [Bool] {
    // Allow checking own completions, or instructor/admin checking any
    if (caller != student and 
        not isCourseInstructor(caller, courseId) and 
        not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only check your own lesson completions");
    };
    
    let courseLessons = lessons.values().toArray().filter(
      func(lesson) { lesson.courseId == courseId }
    ).sort();

    let completionStatuses = courseLessons.map(
      func(lesson) {
        lessonCompletions.toArray().find(
          func(completion) {
            completion.student == student and completion.lessonId == lesson.id
          }
        ) != null;
      }
    );

    completionStatuses;
  };

  // Quiz Management
  public shared ({ caller }) func createQuiz(lessonId : LessonId, questions : [Question]) : async QuizId {
    switch (lessons.get(lessonId)) {
      case (null) { Runtime.trap("Lesson does not exist") };
      case (?lesson) {
        let course = switch (courses.get(lesson.courseId)) {
          case (null) { Runtime.trap("Course does not exist - corrupted lesson") };
          case (?course) {
            if (course.instructor != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Only the course instructor or an admin can create a quiz");
            };
            ();
          };
        };
      };
    };

    quizIdCounter += 1;
    let quizId = quizIdCounter;

    let quiz : Quiz = {
      id = quizId;
      lessonId;
      questions;
    };

    quizzes.add(quizId, quiz);
    quizId;
  };

  public query ({ caller }) func getQuiz(quizId : QuizId) : async Quiz {
    switch (quizzes.get(quizId)) {
      case (null) { Runtime.trap("Quiz does not exist") };
      case (?quiz) {
        let lesson = switch (lessons.get(quiz.lessonId)) {
          case (null) { Runtime.trap("Lesson does not exist - corrupted quiz") };
          case (?lesson) { lesson };
        };
        
        // Verify caller is enrolled in the course or is instructor/admin
        if (not isEnrolledInternal(caller, lesson.courseId) and 
            not isCourseInstructor(caller, lesson.courseId) and 
            not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Must be enrolled in course to view quiz");
        };
        
        quiz;
      };
    };
  };

  public shared ({ caller }) func attemptQuiz(quizId : QuizId, studentAnswers : [Nat]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can attempt quizzes");
    };
    
    switch (quizzes.get(quizId)) {
      case (null) { Runtime.trap("Quiz does not exist") };
      case (?quiz) {
        let lesson = switch (lessons.get(quiz.lessonId)) {
          case (null) { Runtime.trap("Lesson does not exist - corrupted quiz") };
          case (?lesson) {
            if (not isEnrolledInternal(caller, lesson.courseId)) {
              Runtime.trap("Unauthorized: Not enrolled in course");
            };
            lesson;
          };
        };

        if (quiz.questions.size() != studentAnswers.size()) {
          Runtime.trap("Number of answers does not match number of questions");
        };

        let attempt = switch (quizAttempts.toArray().find(
          func(attempt) { attempt.student == caller and attempt.quizId == quizId }
        )) {
          case (null) {
            {
              student = caller;
              quizId;
              score = 0;
              attempts = 0;
              completedAt = 0;
            };
          };
          case (?existingAttempt) {
            existingAttempt
          };
        };

        let correctAnswers = Array.tabulate(
          quiz.questions.size(),
          func(i) {
            let question = quiz.questions[i];
            question.correctOptionIndex == studentAnswers[i];
          }
        );
        let score = correctAnswers.foldLeft(0, func(acc, isCorrect) { if (isCorrect) { acc + 1 } else { acc } });

        let newAttempt : QuizAttempt = {
          student = caller;
          quizId;
          score;
          attempts = attempt.attempts + 1;
          completedAt = Time.now();
        };

        let filteredAttempts = quizAttempts.toArray().filter(
          func(a) { not (a.student == caller and a.quizId == quizId) }
        );
        quizAttempts.clear();
        filteredAttempts.values().forEach(func(a) { quizAttempts.add(a) });
        quizAttempts.add(newAttempt);

        score;
      };
    };
  };

  public query ({ caller }) func getQuizAttempts(student : Principal, quizId : QuizId) : async ?QuizAttempt {
    // Allow checking own attempts, or instructor/admin checking any
    let quiz = switch (quizzes.get(quizId)) {
      case (null) { Runtime.trap("Quiz does not exist") };
      case (?quiz) { quiz };
    };
    
    let lesson = switch (lessons.get(quiz.lessonId)) {
      case (null) { Runtime.trap("Lesson does not exist - corrupted quiz") };
      case (?lesson) { lesson };
    };
    
    if (caller != student and 
        not isCourseInstructor(caller, lesson.courseId) and 
        not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own quiz attempts");
    };
    
    quizAttempts.toArray().find(
      func(attempt) {
        attempt.student == student and attempt.quizId == quizId;
      }
    );
  };

  // Dashboard Queries
  public query ({ caller }) func getStudentDashboard() : async [(CourseId, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard");
    };
    
    let enrolledCourseIds = enrollments.toArray().filter(
      func(e) { e.student == caller }
    ).map(func(e) { e.courseId });

    enrolledCourseIds.map(
      func(courseId) {
        let courseLessons = lessons.values().toArray().filter(
          func(lesson) { lesson.courseId == courseId }
        );
        let totalLessons = courseLessons.size();

        let completionPercentage = if (totalLessons == 0) {
          0
        } else {
          let completedLessons = courseLessons.foldLeft(
            0,
            func(acc, lesson) {
              switch (lessonCompletions.toArray().find(
                func(completion) {
                  completion.student == caller and completion.lessonId == lesson.id;
                }
              )) {
                case (null) { acc };
                case (?_) { acc + 1 };
              };
            },
          );
          (completedLessons * 100) / totalLessons;
        };

        (courseId, completionPercentage);
      }
    );
  };

  public query ({ caller }) func getInstructorDashboard() : async [(CourseId, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard");
    };
    
    let instructorCourses = courses.values().toArray().filter(
      func(course) { course.instructor == caller }
    );

    instructorCourses.map(
      func(course) {
        let enrollmentCount = enrollments.toArray().filter(
          func(e) { e.courseId == course.id }
        ).size();
        (course.id, enrollmentCount);
      }
    );
  };

  public query ({ caller }) func getAdminDashboard() : async { totalUsers : Nat; totalCourses : Nat; totalEnrollments : Nat } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view admin dashboard");
    };
    
    {
      totalUsers = userProfiles.size();
      totalCourses = courses.size();
      totalEnrollments = enrollments.toArray().size();
    };
  };
};
