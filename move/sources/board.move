/// Bounty Board - On-Chain Coordination & Work Management System
/// 
/// This module implements a decentralized task management system on Sui blockchain
/// with configurable workflows, hierarchical tasks, and role-based access control.
module bounty_board::board {
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::{Self, String};

    // ==================== Error Codes ====================
    const ENotAuthorized: u64 = 0;
    const ENotAdmin: u64 = 1;
    const ENotMember: u64 = 2;
    const EInvalidStatus: u64 = 3;
    const EMemberAlreadyExists: u64 = 4;
    const EMemberNotFound: u64 = 5;
    const ECannotRemoveSelf: u64 = 6;
    const EStatusInUse: u64 = 7;
    const EInvalidParentTask: u64 = 8;
    const ETaskNotFound: u64 = 9;

    // ==================== Role Constants ====================
    const ROLE_ADMIN: u8 = 2;
    const ROLE_CONTRIBUTOR: u8 = 1;

    // ==================== Structs ====================

    /// Board represents a workspace containing tasks and members
    /// Stored as a shared object for collaborative access
    public struct Board has key, store {
        id: UID,
        name: String,
        description: String,
        owner: address,
        /// Members table: address -> role (1 = Contributor, 2 = Admin)
        members: Table<address, u8>,
        /// Configurable workflow statuses for this board
        statuses: vector<String>,
        /// Task IDs belonging to this board
        task_ids: vector<ID>,
        /// Analytics counters
        total_tasks: u64,
        completed_tasks: u64,
        created_at: u64,
    }

    /// Task represents a work item within a board
    /// Stored as separate shared objects for scalability
    public struct Task has key, store {
        id: UID,
        board_id: ID,
        title: String,
        description: String,
        /// Current status (must be one of board's configured statuses)
        status: String,
        /// Single assignee address (0x0 if unassigned)
        assignee: Option<address>,
        /// Unix timestamp for due date (0 if no due date)
        due_date: u64,
        /// Effort estimation in hours
        effort_hours: u64,
        /// Parent task ID for hierarchical tasks (None if root task)
        parent_task_id: Option<ID>,
        /// Child task IDs (subtasks)
        subtask_ids: vector<ID>,
        /// Creator address
        creator: address,
        created_at: u64,
        updated_at: u64,
    }

    /// AdminCap - Capability object for board administrators
    /// Grants permission to manage members and board configuration
    public struct AdminCap has key, store {
        id: UID,
        board_id: ID,
    }

    /// ContributorCap - Capability object for contributors
    /// Grants permission to create and update tasks
    public struct ContributorCap has key, store {
        id: UID,
        board_id: ID,
    }

    // ==================== Events ====================

    public struct BoardCreated has copy, drop {
        board_id: ID,
        name: String,
        owner: address,
    }

    public struct MemberAdded has copy, drop {
        board_id: ID,
        member: address,
        role: u8,
    }

    public struct MemberRemoved has copy, drop {
        board_id: ID,
        member: address,
    }

    public struct MemberRoleUpdated has copy, drop {
        board_id: ID,
        member: address,
        new_role: u8,
    }

    public struct TaskCreated has copy, drop {
        task_id: ID,
        board_id: ID,
        title: String,
        creator: address,
    }

    public struct TaskUpdated has copy, drop {
        task_id: ID,
        board_id: ID,
        updated_by: address,
    }

    public struct TaskStatusChanged has copy, drop {
        task_id: ID,
        board_id: ID,
        old_status: String,
        new_status: String,
    }

    public struct TaskAssigned has copy, drop {
        task_id: ID,
        board_id: ID,
        assignee: address,
    }

    public struct StatusAdded has copy, drop {
        board_id: ID,
        status: String,
    }

    public struct StatusRemoved has copy, drop {
        board_id: ID,
        status: String,
    }

    public struct SubtaskCreated has copy, drop {
        task_id: ID,
        parent_task_id: ID,
        board_id: ID,
    }

    // ==================== Board Functions ====================

    /// Create a new board with default statuses
    /// The creator becomes the owner and first admin
    public fun create_board(
        name: vector<u8>,
        description: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let board_uid = object::new(ctx);
        let board_id = board_uid.to_inner();
        
        // Initialize default statuses
        let mut statuses = vector::empty<String>();
        vector::push_back(&mut statuses, string::utf8(b"To-Do"));
        vector::push_back(&mut statuses, string::utf8(b"In-Progress"));
        vector::push_back(&mut statuses, string::utf8(b"Blocked"));
        vector::push_back(&mut statuses, string::utf8(b"Completed"));

        // Create members table and add owner as admin
        let mut members = table::new<address, u8>(ctx);
        table::add(&mut members, sender, ROLE_ADMIN);

        let board = Board {
            id: board_uid,
            name: string::utf8(name),
            description: string::utf8(description),
            owner: sender,
            members,
            statuses,
            task_ids: vector::empty(),
            total_tasks: 0,
            completed_tasks: 0,
            created_at: ctx.epoch_timestamp_ms(),
        };

        // Create admin capability for the owner
        let admin_cap = AdminCap {
            id: object::new(ctx),
            board_id,
        };

        // Create contributor capability for the owner
        let contributor_cap = ContributorCap {
            id: object::new(ctx),
            board_id,
        };

        event::emit(BoardCreated {
            board_id,
            name: string::utf8(name),
            owner: sender,
        });

        transfer::share_object(board);
        transfer::transfer(admin_cap, sender);
        transfer::transfer(contributor_cap, sender);
    }

    /// Update board metadata (admin only)
    public fun update_board(
        board: &mut Board,
        _admin_cap: &AdminCap,
        name: vector<u8>,
        description: vector<u8>,
        _ctx: &mut TxContext
    ) {
        assert!(_admin_cap.board_id == object::id(board), ENotAuthorized);
        board.name = string::utf8(name);
        board.description = string::utf8(description);
    }

    // ==================== Member Management Functions ====================

    /// Add a member to the board (admin only)
    public fun add_member(
        board: &mut Board,
        _admin_cap: &AdminCap,
        member: address,
        role: u8,
        ctx: &mut TxContext
    ) {
        assert!(_admin_cap.board_id == object::id(board), ENotAuthorized);
        assert!(!table::contains(&board.members, member), EMemberAlreadyExists);
        assert!(role == ROLE_CONTRIBUTOR || role == ROLE_ADMIN, ENotAuthorized);

        table::add(&mut board.members, member, role);

        // Create appropriate capability for the new member
        if (role == ROLE_ADMIN) {
            let admin_cap = AdminCap {
                id: object::new(ctx),
                board_id: object::id(board),
            };
            let contributor_cap = ContributorCap {
                id: object::new(ctx),
                board_id: object::id(board),
            };
            transfer::transfer(admin_cap, member);
            transfer::transfer(contributor_cap, member);
        } else {
            let contributor_cap = ContributorCap {
                id: object::new(ctx),
                board_id: object::id(board),
            };
            transfer::transfer(contributor_cap, member);
        };

        event::emit(MemberAdded {
            board_id: object::id(board),
            member,
            role,
        });
    }

    /// Remove a member from the board (admin only)
    public fun remove_member(
        board: &mut Board,
        _admin_cap: &AdminCap,
        member: address,
        ctx: &mut TxContext
    ) {
        assert!(_admin_cap.board_id == object::id(board), ENotAuthorized);
        assert!(table::contains(&board.members, member), EMemberNotFound);
        assert!(member != ctx.sender(), ECannotRemoveSelf);

        table::remove(&mut board.members, member);

        event::emit(MemberRemoved {
            board_id: object::id(board),
            member,
        });
    }

    /// Update a member's role (admin only)
    public fun update_member_role(
        board: &mut Board,
        _admin_cap: &AdminCap,
        member: address,
        new_role: u8,
        ctx: &mut TxContext
    ) {
        assert!(_admin_cap.board_id == object::id(board), ENotAuthorized);
        assert!(table::contains(&board.members, member), EMemberNotFound);
        assert!(new_role == ROLE_CONTRIBUTOR || new_role == ROLE_ADMIN, ENotAuthorized);

        // If upgrading to admin, send admin cap
        let old_role = *table::borrow(&board.members, member);
        if (old_role == ROLE_CONTRIBUTOR && new_role == ROLE_ADMIN) {
            let admin_cap = AdminCap {
                id: object::new(ctx),
                board_id: object::id(board),
            };
            transfer::transfer(admin_cap, member);
        };

        *table::borrow_mut(&mut board.members, member) = new_role;

        event::emit(MemberRoleUpdated {
            board_id: object::id(board),
            member,
            new_role,
        });
    }

    // ==================== Status Management Functions ====================

    /// Add a new status to the board workflow (admin only)
    public fun add_status(
        board: &mut Board,
        _admin_cap: &AdminCap,
        status: vector<u8>,
        _ctx: &mut TxContext
    ) {
        assert!(_admin_cap.board_id == object::id(board), ENotAuthorized);
        
        let status_string = string::utf8(status);
        vector::push_back(&mut board.statuses, status_string);

        event::emit(StatusAdded {
            board_id: object::id(board),
            status: status_string,
        });
    }

    /// Remove a status from the board workflow (admin only)
    /// Note: Should ensure no tasks use this status before removal
    public fun remove_status(
        board: &mut Board,
        _admin_cap: &AdminCap,
        status: vector<u8>,
        _ctx: &mut TxContext
    ) {
        assert!(_admin_cap.board_id == object::id(board), ENotAuthorized);
        
        let status_string = string::utf8(status);
        let (found, index) = vector::index_of(&board.statuses, &status_string);
        assert!(found, EInvalidStatus);
        
        vector::remove(&mut board.statuses, index);

        event::emit(StatusRemoved {
            board_id: object::id(board),
            status: status_string,
        });
    }

    // ==================== Task Functions ====================

    /// Create a new task (contributor or admin)
    public fun create_task(
        board: &mut Board,
        _contributor_cap: &ContributorCap,
        title: vector<u8>,
        description: vector<u8>,
        status: vector<u8>,
        due_date: u64,
        effort_hours: u64,
        ctx: &mut TxContext
    ) {
        assert!(_contributor_cap.board_id == object::id(board), ENotAuthorized);
        
        let status_string = string::utf8(status);
        assert!(is_valid_status(board, &status_string), EInvalidStatus);

        let task_uid = object::new(ctx);
        let task_id = task_uid.to_inner();
        let board_id = object::id(board);
        let sender = ctx.sender();
        let now = ctx.epoch_timestamp_ms();

        let task = Task {
            id: task_uid,
            board_id,
            title: string::utf8(title),
            description: string::utf8(description),
            status: status_string,
            assignee: option::none(),
            due_date,
            effort_hours,
            parent_task_id: option::none(),
            subtask_ids: vector::empty(),
            creator: sender,
            created_at: now,
            updated_at: now,
        };

        vector::push_back(&mut board.task_ids, task_id);
        board.total_tasks = board.total_tasks + 1;

        event::emit(TaskCreated {
            task_id,
            board_id,
            title: string::utf8(title),
            creator: sender,
        });

        transfer::share_object(task);
    }

    /// Create a subtask under a parent task (contributor or admin)
    public fun create_subtask(
        board: &mut Board,
        parent_task: &mut Task,
        _contributor_cap: &ContributorCap,
        title: vector<u8>,
        description: vector<u8>,
        status: vector<u8>,
        due_date: u64,
        effort_hours: u64,
        ctx: &mut TxContext
    ) {
        assert!(_contributor_cap.board_id == object::id(board), ENotAuthorized);
        assert!(parent_task.board_id == object::id(board), EInvalidParentTask);
        
        let status_string = string::utf8(status);
        assert!(is_valid_status(board, &status_string), EInvalidStatus);

        let task_uid = object::new(ctx);
        let task_id = task_uid.to_inner();
        let board_id = object::id(board);
        let parent_id = object::id(parent_task);
        let sender = ctx.sender();
        let now = ctx.epoch_timestamp_ms();

        let task = Task {
            id: task_uid,
            board_id,
            title: string::utf8(title),
            description: string::utf8(description),
            status: status_string,
            assignee: option::none(),
            due_date,
            effort_hours,
            parent_task_id: option::some(parent_id),
            subtask_ids: vector::empty(),
            creator: sender,
            created_at: now,
            updated_at: now,
        };

        // Add subtask ID to parent
        vector::push_back(&mut parent_task.subtask_ids, task_id);
        parent_task.updated_at = now;

        vector::push_back(&mut board.task_ids, task_id);
        board.total_tasks = board.total_tasks + 1;

        event::emit(SubtaskCreated {
            task_id,
            parent_task_id: parent_id,
            board_id,
        });

        event::emit(TaskCreated {
            task_id,
            board_id,
            title: string::utf8(title),
            creator: sender,
        });

        transfer::share_object(task);
    }

    /// Update task details (contributor or admin)
    public fun update_task(
        board: &Board,
        task: &mut Task,
        _contributor_cap: &ContributorCap,
        title: vector<u8>,
        description: vector<u8>,
        due_date: u64,
        effort_hours: u64,
        ctx: &mut TxContext
    ) {
        assert!(_contributor_cap.board_id == object::id(board), ENotAuthorized);
        assert!(task.board_id == object::id(board), ETaskNotFound);

        task.title = string::utf8(title);
        task.description = string::utf8(description);
        task.due_date = due_date;
        task.effort_hours = effort_hours;
        task.updated_at = ctx.epoch_timestamp_ms();

        event::emit(TaskUpdated {
            task_id: object::id(task),
            board_id: object::id(board),
            updated_by: ctx.sender(),
        });
    }

    /// Change task status (contributor or admin)
    public fun update_task_status(
        board: &mut Board,
        task: &mut Task,
        _contributor_cap: &ContributorCap,
        new_status: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(_contributor_cap.board_id == object::id(board), ENotAuthorized);
        assert!(task.board_id == object::id(board), ETaskNotFound);
        
        let new_status_string = string::utf8(new_status);
        assert!(is_valid_status(board, &new_status_string), EInvalidStatus);

        let old_status = task.status;
        
        // Update completed tasks counter
        let completed_status = string::utf8(b"Completed");
        if (new_status_string == completed_status && old_status != completed_status) {
            board.completed_tasks = board.completed_tasks + 1;
        } else if (old_status == completed_status && new_status_string != completed_status) {
            board.completed_tasks = board.completed_tasks - 1;
        };

        task.status = new_status_string;
        task.updated_at = ctx.epoch_timestamp_ms();

        event::emit(TaskStatusChanged {
            task_id: object::id(task),
            board_id: object::id(board),
            old_status,
            new_status: new_status_string,
        });
    }

    /// Assign task to a member (contributor or admin)
    public fun assign_task(
        board: &Board,
        task: &mut Task,
        _contributor_cap: &ContributorCap,
        assignee: address,
        ctx: &mut TxContext
    ) {
        assert!(_contributor_cap.board_id == object::id(board), ENotAuthorized);
        assert!(task.board_id == object::id(board), ETaskNotFound);
        assert!(table::contains(&board.members, assignee), ENotMember);

        task.assignee = option::some(assignee);
        task.updated_at = ctx.epoch_timestamp_ms();

        event::emit(TaskAssigned {
            task_id: object::id(task),
            board_id: object::id(board),
            assignee,
        });
    }

    /// Unassign task (contributor or admin)
    public fun unassign_task(
        board: &Board,
        task: &mut Task,
        _contributor_cap: &ContributorCap,
        ctx: &mut TxContext
    ) {
        assert!(_contributor_cap.board_id == object::id(board), ENotAuthorized);
        assert!(task.board_id == object::id(board), ETaskNotFound);

        task.assignee = option::none();
        task.updated_at = ctx.epoch_timestamp_ms();

        event::emit(TaskUpdated {
            task_id: object::id(task),
            board_id: object::id(board),
            updated_by: ctx.sender(),
        });
    }

    // ==================== View Functions ====================

    /// Check if a status is valid for a board
    public fun is_valid_status(board: &Board, status: &String): bool {
        vector::contains(&board.statuses, status)
    }

    /// Check if an address is a member of the board
    public fun is_member(board: &Board, addr: address): bool {
        table::contains(&board.members, addr)
    }

    /// Get member role (returns 0 if not a member)
    public fun get_member_role(board: &Board, addr: address): u8 {
        if (table::contains(&board.members, addr)) {
            *table::borrow(&board.members, addr)
        } else {
            0
        }
    }

    /// Check if address is admin
    public fun is_admin(board: &Board, addr: address): bool {
        if (table::contains(&board.members, addr)) {
            *table::borrow(&board.members, addr) == ROLE_ADMIN
        } else {
            false
        }
    }

    // ==================== Getter Functions ====================

    public fun board_id(board: &Board): ID {
        object::id(board)
    }

    public fun board_name(board: &Board): String {
        board.name
    }

    public fun board_description(board: &Board): String {
        board.description
    }

    public fun board_owner(board: &Board): address {
        board.owner
    }

    public fun board_statuses(board: &Board): vector<String> {
        board.statuses
    }

    public fun board_task_ids(board: &Board): vector<ID> {
        board.task_ids
    }

    public fun board_total_tasks(board: &Board): u64 {
        board.total_tasks
    }

    public fun board_completed_tasks(board: &Board): u64 {
        board.completed_tasks
    }

    public fun task_board_id(task: &Task): ID {
        task.board_id
    }

    public fun task_title(task: &Task): String {
        task.title
    }

    public fun task_description(task: &Task): String {
        task.description
    }

    public fun task_status(task: &Task): String {
        task.status
    }

    public fun task_assignee(task: &Task): Option<address> {
        task.assignee
    }

    public fun task_due_date(task: &Task): u64 {
        task.due_date
    }

    public fun task_effort_hours(task: &Task): u64 {
        task.effort_hours
    }

    public fun task_parent_id(task: &Task): Option<ID> {
        task.parent_task_id
    }

    public fun task_subtask_ids(task: &Task): vector<ID> {
        task.subtask_ids
    }

    public fun task_creator(task: &Task): address {
        task.creator
    }

    public fun admin_cap_board_id(cap: &AdminCap): ID {
        cap.board_id
    }

    public fun contributor_cap_board_id(cap: &ContributorCap): ID {
        cap.board_id
    }

    // ==================== Constants Accessors ====================

    public fun role_admin(): u8 { ROLE_ADMIN }
    public fun role_contributor(): u8 { ROLE_CONTRIBUTOR }
}
