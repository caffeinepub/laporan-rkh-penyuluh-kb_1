import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type NIP = string;
export type Location = string;
export type WilayahKerja = string;
export type Time = bigint;
export interface Profile {
    nip: NIP;
    signature?: ExternalBlob;
    namalengkap: FullName;
    wilayahKerja: WilayahKerja;
    jabatan: Tugas;
    phoneNumber: PhoneNumber;
    unitKerja: string;
}
export type PhoneNumber = string;
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export type Tugas = string;
export interface RKHWithUser {
    rkh: RKH;
    user: Principal;
}
export type Action = bigint;
export interface UserSummary {
    user: Principal;
    totalReports: bigint;
    profile?: Profile;
}
export type FullName = string;
export interface RKH {
    action: Action;
    targetGroup: TargetGroup;
    date: Time;
    completedAction: CompletedAction;
    document?: ExternalBlob;
    image?: ExternalBlob;
    numTargeted: bigint;
    place: Location;
    remarks?: string;
}
export type CompletedAction = string;
export interface UserProfile {
    nip: NIP;
    signature?: ExternalBlob;
    namalengkap: FullName;
    wilayahKerja: WilayahKerja;
    jabatan: Tugas;
    phoneNumber: PhoneNumber;
    unitKerja: string;
}
export type TargetGroup = string;
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addRKH(rkh: RKH): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteRKH(actionId: Action): Promise<void>;
    generateUserToken(user: Principal): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDayRKH(user: Principal, day: Time): Promise<Array<RKH>>;
    getMonthRKH(user: Principal, start: Time, end: Time): Promise<Array<RKH>>;
    getMonthlyRecap(start: Time, end: Time): Promise<Array<RKHWithUser>>;
    getProfile(user: Principal): Promise<Profile | null>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    getWeekRKH(user: Principal, start: Time, end: Time): Promise<Array<RKH>>;
    getYearRKH(user: Principal, start: Time, end: Time): Promise<Array<RKH>>;
    getYearlyRecap(start: Time, end: Time): Promise<Array<RKHWithUser>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listAllRKH(): Promise<Array<RKHWithUser>>;
    listAllUsers(): Promise<Array<UserSummary>>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    requestApproval(): Promise<void>;
    saveCallerProfile(profile: Profile, signature: ExternalBlob | null): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
}
