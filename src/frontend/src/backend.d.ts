import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Course {
    id: CourseId;
    title: string;
    instructor: Principal;
    createdAt: Time;
    description: string;
    category: string;
}
export type Time = bigint;
export interface Lesson {
    id: LessonId;
    title: string;
    content: string;
    order: bigint;
    createdAt: Time;
    courseId: CourseId;
}
export interface QuizAttempt {
    completedAt: Time;
    attempts: bigint;
    score: bigint;
    student: Principal;
    quizId: QuizId;
}
export type LessonId = bigint;
export interface Quiz {
    id: QuizId;
    lessonId: LessonId;
    questions: Array<Question>;
}
export type QuestionId = bigint;
export interface Question {
    id: QuestionId;
    questionText: string;
    correctOptionIndex: bigint;
    options: Array<string>;
}
export type CourseId = bigint;
export interface UserProfile {
    name: string;
    role: string;
}
export type QuizId = bigint;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    attemptQuiz(quizId: QuizId, studentAnswers: Array<bigint>): Promise<bigint>;
    completeLesson(lessonId: LessonId): Promise<void>;
    createCourse(title: string, description: string, category: string): Promise<CourseId>;
    createLesson(courseId: CourseId, title: string, content: string, order: bigint): Promise<LessonId>;
    createQuiz(lessonId: LessonId, questions: Array<Question>): Promise<QuizId>;
    deleteCourse(courseId: CourseId): Promise<void>;
    deleteLesson(lessonId: LessonId): Promise<void>;
    enrollInCourse(courseId: CourseId): Promise<void>;
    getAdminDashboard(): Promise<{
        totalEnrollments: bigint;
        totalUsers: bigint;
        totalCourses: bigint;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCourse(courseId: CourseId): Promise<Course>;
    getCourseCompletion(student: Principal, courseId: CourseId): Promise<bigint>;
    getCourseLessonCompletions(student: Principal, courseId: CourseId): Promise<Array<boolean>>;
    getCourseStudents(courseId: CourseId): Promise<Array<Principal>>;
    getEnrolledCourses(student: Principal): Promise<Array<CourseId>>;
    getInstructorDashboard(): Promise<Array<[CourseId, bigint]>>;
    getLesson(lessonId: LessonId): Promise<Lesson>;
    getQuiz(quizId: QuizId): Promise<Quiz>;
    getQuizAttempts(student: Principal, quizId: QuizId): Promise<QuizAttempt | null>;
    getStudentDashboard(): Promise<Array<[CourseId, bigint]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isEnrolled(student: Principal, courseId: CourseId): Promise<boolean>;
    isLessonCompleted(student: Principal, lessonId: LessonId): Promise<boolean>;
    listCourseLessons(courseId: CourseId): Promise<Array<Lesson>>;
    listCourses(): Promise<Array<Course>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    unenrollFromCourse(courseId: CourseId): Promise<void>;
    updateCourse(courseId: CourseId, title: string, description: string, category: string): Promise<void>;
    updateLesson(lessonId: LessonId, title: string, content: string, order: bigint): Promise<void>;
}
