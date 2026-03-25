import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import UserApproval "user-approval/approval";

actor {
  // === STATE TYPES ===
  type UserToken = Text;
  type UserTokens = Map.Map<Principal, UserToken>;
  type Pitch = Nat;
  type PitchScores = Map.Map<Principal, Pitch>;

  // === DATA TYPES ===

  // Profile
  type NIP = Text;
  type Tugas = Text;
  type WilayahKerja = Text;
  type PhoneNumber = Text;
  type FullName = Text;

  public type UserProfile = {
    nip : NIP;
    namalengkap : FullName;
    jabatan : Tugas;
    unitKerja : Text;
    wilayahKerja : WilayahKerja;
    phoneNumber : PhoneNumber;
    signature : ?Storage.ExternalBlob;
  };

  type Profile = UserProfile;

  // RKH
  type TargetGroup = Text;
  type Location = Text;
  type CompletedAction = Text;
  type Action = Nat;

  type RKH = {
    date : Time.Time;
    action : Action;
    targetGroup : TargetGroup;
    numTargeted : Nat;
    place : Location;
    completedAction : CompletedAction;
    remarks : ?Text;
    document : ?Storage.ExternalBlob;
    image : ?Storage.ExternalBlob;
  };

  // === STATE ===
  let userTokens = Map.empty<Principal, UserToken>();
  var generatedTokenBase = "Lupalagi09@";
  let allProfiles = Map.empty<Principal, Profile>();
  var nextTokenId = 0;

  // === MODULES ===
  module Profile {
    public func compare(profile1 : Profile, profile2 : Profile) : Order.Order {
      switch (Text.compare(profile1.nip, profile2.nip)) {
        case (#equal) { Text.compare(profile1.nip, profile2.nip) };
        case (order) { order };
      };
    };
  };

  module RKH {
    public func compareByDate(rkh1 : RKH, rkh2 : RKH) : Order.Order {
      Int.compare(rkh1.date, rkh2.date);
    };
  };

  // Include authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Include blob storage
  include MixinStorage();

  // Include approval
  let approvalState = UserApproval.initState(accessControlState);

  // Fuehrungsverzeichnis
  let allRKHData = Map.empty<Principal, List.List<RKH>>();

  // === LOGIC ===

  // (1) Admin create token for user
  public shared ({ caller }) func generateUserToken(user : Principal) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can generate tokens");
    };
    let token = generatedTokenBase.concat(nextTokenId.toText());
    nextTokenId += 1;
    userTokens.add(user, token);
    token;
  };

  // (2) User profile - Required by frontend
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    allProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    allProfiles.add(caller, profile);
  };

  public shared ({ caller }) func saveCallerProfile(profile : Profile, signature : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let newProfile : Profile = {
      profile with
      signature;
    };
    allProfiles.add(caller, newProfile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    allProfiles.get(user);
  };

  public query ({ caller }) func getProfile(user : Principal) : async ?Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    allProfiles.get(user);
  };

  // (3) Create new Rencana/Kegiatan
  public shared ({ caller }) func addRKH(rkh : RKH) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Token not verified. Please contact admin");
    };

    var existingRKHData = switch (allRKHData.get(caller)) {
      case (?rkh) { rkh };
      case (null) { List.empty<RKH>() };
    };

    existingRKHData.add(rkh);
    allRKHData.add(caller, existingRKHData);
  };

  // (3b) Delete RKH by action id (user deletes own report)
  public shared ({ caller }) func deleteRKH(actionId : Action) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Token not verified. Please contact admin");
    };

    switch (allRKHData.get(caller)) {
      case (?existingRKHData) {
        let filtered = existingRKHData.filter(
          func(rkh : RKH) : Bool { rkh.action != actionId }
        );
        allRKHData.add(caller, filtered);
      };
      case (null) {};
    };
  };

  // (3c) Admin delete RKH for a specific user
  public shared ({ caller }) func adminDeleteRKH(user : Principal, actionId : Action) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete reports for other users");
    };

    switch (allRKHData.get(user)) {
      case (?existingRKHData) {
        let filtered = existingRKHData.filter(
          func(rkh : RKH) : Bool { rkh.action != actionId }
        );
        allRKHData.add(user, filtered);
      };
      case (null) {};
    };
  };

  public query ({ caller }) func getDayRKH(user : Principal, day : Time.Time) : async [RKH] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own RKH data");
    };
    
    if (not allRKHData.containsKey(user)) { return [] };
    switch (allRKHData.get(user)) {
      case (?existingRKHData) {
        existingRKHData.filter(
          func(data : RKH) : Bool { data.date == day }
        ).toArray();
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getWeekRKH(user : Principal, start : Time.Time, end : Time.Time) : async [RKH] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own RKH data");
    };
    
    if (not allRKHData.containsKey(user)) { return [] };
    switch (allRKHData.get(user)) {
      case (?existingRKHData) {
        existingRKHData.filter(
          func(data : RKH) : Bool { data.date <= end and data.date >= start }
        ).toArray();
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getMonthRKH(user : Principal, start : Time.Time, end : Time.Time) : async [RKH] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own RKH data");
    };
    
    if (not allRKHData.containsKey(user)) { return [] };
    switch (allRKHData.get(user)) {
      case (?existingRKHData) {
        existingRKHData.filter(
          func(data : RKH) : Bool {
            data.date >= start and data.date <= end
          }
        ).toArray();
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getYearRKH(user : Principal, start : Time.Time, end : Time.Time) : async [RKH] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own RKH data");
    };
    
    if (not allRKHData.containsKey(user)) { return [] };
    switch (allRKHData.get(user)) {
      case (?existingRKHData) {
        existingRKHData.filter(
          func(data : RKH) : Bool {
            data.date >= start and data.date <= end
          }
        ).toArray();
      };
      case (null) { [] };
    };
  };

  // (4) Admin features
  public type UserSummary = {
    user : Principal;
    profile : ?Profile;
    totalReports : Nat;
  };

  public query ({ caller }) func listAllUsers() : async [UserSummary] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    
    let users = allProfiles.toArray();
    users.map<(Principal, Profile), UserSummary>(
      func((user, profile) : (Principal, Profile)) : UserSummary {
        let totalReports = switch (allRKHData.get(user)) {
          case (?rkhList) { rkhList.size() };
          case (null) { 0 };
        };
        {
          user = user;
          profile = ?profile;
          totalReports = totalReports;
        }
      }
    );
  };

  public type RKHWithUser = {
    user : Principal;
    rkh : RKH;
  };

  public query ({ caller }) func listAllRKH() : async [RKHWithUser] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can list all RKH reports");
    };
    
    let allData = allRKHData.toArray();
    let result = List.empty<RKHWithUser>();
    
    for ((user, rkhList) in allData.vals()) {
      for (rkh in rkhList.values()) {
        result.add({ user = user; rkh = rkh });
      };
    };
    
    result.toArray();
  };

  public query ({ caller }) func getMonthlyRecap(start : Time.Time, end : Time.Time) : async [RKHWithUser] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view recaps");
    };
    
    let allData = allRKHData.toArray();
    let result = List.empty<RKHWithUser>();
    
    for ((user, rkhList) in allData.vals()) {
      let filtered = rkhList.filter(
        func(rkh : RKH) : Bool {
          rkh.date >= start and rkh.date <= end
        }
      );
      for (rkh in filtered.values()) {
        result.add({ user = user; rkh = rkh });
      };
    };
    
    result.toArray();
  };

  public query ({ caller }) func getYearlyRecap(start : Time.Time, end : Time.Time) : async [RKHWithUser] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view recaps");
    };
    
    let allData = allRKHData.toArray();
    let result = List.empty<RKHWithUser>();
    
    for ((user, rkhList) in allData.vals()) {
      let filtered = rkhList.filter(
        func(rkh : RKH) : Bool {
          rkh.date >= start and rkh.date <= end
        }
      );
      for (rkh in filtered.values()) {
        result.add({ user = user; rkh = rkh });
      };
    };
    
    result.toArray();
  };

  // === Approval System ===

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };
};
