/// Tests for the Bounty Board smart contract
#[test_only]
module bounty_board::board_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::test_utils::assert_eq;
    use std::string;
    use bounty_board::board::{Self, Board, Task, AdminCap, ContributorCap};

    // Test addresses
    const ADMIN: address = @0xAD;
    const MEMBER1: address = @0xB1;
    const MEMBER2: address = @0xB2;
    const NON_MEMBER: address = @0xC1;

    // ==================== Helper Functions ====================

    fun setup_board(scenario: &mut Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            board::create_board(
                b"Test Board",
                b"A test board for unit testing",
                ts::ctx(scenario)
            );
        };
    }

    fun get_board(scenario: &mut Scenario): Board {
        ts::next_tx(scenario, ADMIN);
        ts::take_shared<Board>(scenario)
    }

    // ==================== Board Creation Tests ====================

    #[test]
    fun test_create_board() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create a board
        setup_board(&mut scenario);

        // Verify board was created correctly
        ts::next_tx(&mut scenario, ADMIN);
        {
            let board = ts::take_shared<Board>(&scenario);
            
            assert_eq(board::board_name(&board), string::utf8(b"Test Board"));
            assert_eq(board::board_description(&board), string::utf8(b"A test board for unit testing"));
            assert_eq(board::board_owner(&board), ADMIN);
            assert_eq(board::board_total_tasks(&board), 0);
            assert_eq(board::board_completed_tasks(&board), 0);
            
            // Verify default statuses
            let statuses = board::board_statuses(&board);
            assert_eq(vector::length(&statuses), 4);
            
            // Verify owner is admin
            assert!(board::is_admin(&board, ADMIN), 0);
            assert!(board::is_member(&board, ADMIN), 1);
            assert_eq(board::get_member_role(&board, ADMIN), board::role_admin());
            
            ts::return_shared(board);
        };

        // Verify admin received AdminCap
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            ts::return_to_sender(&scenario, admin_cap);
        };

        // Verify admin received ContributorCap
        ts::next_tx(&mut scenario, ADMIN);
        {
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_update_board() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::update_board(
                &mut board,
                &admin_cap,
                b"Updated Board Name",
                b"Updated description",
                ts::ctx(&mut scenario)
            );

            assert_eq(board::board_name(&board), string::utf8(b"Updated Board Name"));
            assert_eq(board::board_description(&board), string::utf8(b"Updated description"));

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        ts::end(scenario);
    }

    // ==================== Member Management Tests ====================

    #[test]
    fun test_add_contributor_member() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Add a contributor member
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::add_member(
                &mut board,
                &admin_cap,
                MEMBER1,
                board::role_contributor(),
                ts::ctx(&mut scenario)
            );

            assert!(board::is_member(&board, MEMBER1), 0);
            assert_eq(board::get_member_role(&board, MEMBER1), board::role_contributor());
            assert!(!board::is_admin(&board, MEMBER1), 1);

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        // Verify member received ContributorCap
        ts::next_tx(&mut scenario, MEMBER1);
        {
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_add_admin_member() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Add an admin member
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::add_member(
                &mut board,
                &admin_cap,
                MEMBER1,
                board::role_admin(),
                ts::ctx(&mut scenario)
            );

            assert!(board::is_member(&board, MEMBER1), 0);
            assert!(board::is_admin(&board, MEMBER1), 1);

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        // Verify member received both AdminCap and ContributorCap
        ts::next_tx(&mut scenario, MEMBER1);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);
            ts::return_to_sender(&scenario, admin_cap);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_remove_member() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Add a member
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::add_member(
                &mut board,
                &admin_cap,
                MEMBER1,
                board::role_contributor(),
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        // Remove the member
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::remove_member(
                &mut board,
                &admin_cap,
                MEMBER1,
                ts::ctx(&mut scenario)
            );

            assert!(!board::is_member(&board, MEMBER1), 0);

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_update_member_role() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Add a contributor
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::add_member(
                &mut board,
                &admin_cap,
                MEMBER1,
                board::role_contributor(),
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        // Upgrade to admin
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::update_member_role(
                &mut board,
                &admin_cap,
                MEMBER1,
                board::role_admin(),
                ts::ctx(&mut scenario)
            );

            assert!(board::is_admin(&board, MEMBER1), 0);

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = board::EMemberAlreadyExists)]
    fun test_add_duplicate_member_fails() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Add a member
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::add_member(
                &mut board,
                &admin_cap,
                MEMBER1,
                board::role_contributor(),
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        // Try to add same member again - should fail
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::add_member(
                &mut board,
                &admin_cap,
                MEMBER1,
                board::role_contributor(),
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        ts::end(scenario);
    }

    // ==================== Status Management Tests ====================

    #[test]
    fun test_add_status() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::add_status(
                &mut board,
                &admin_cap,
                b"Review",
                ts::ctx(&mut scenario)
            );

            let statuses = board::board_statuses(&board);
            assert_eq(vector::length(&statuses), 5);
            assert!(board::is_valid_status(&board, &string::utf8(b"Review")), 0);

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_remove_status() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::remove_status(
                &mut board,
                &admin_cap,
                b"Blocked",
                ts::ctx(&mut scenario)
            );

            let statuses = board::board_statuses(&board);
            assert_eq(vector::length(&statuses), 3);
            assert!(!board::is_valid_status(&board, &string::utf8(b"Blocked")), 0);

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        ts::end(scenario);
    }

    // ==================== Task Management Tests ====================

    #[test]
    fun test_create_task() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::create_task(
                &mut board,
                &contributor_cap,
                b"Test Task",
                b"This is a test task",
                b"To-Do",
                1704067200000, // Jan 1, 2024
                8,
                ts::ctx(&mut scenario)
            );

            assert_eq(board::board_total_tasks(&board), 1);

            ts::return_shared(board);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        // Verify task was created
        ts::next_tx(&mut scenario, ADMIN);
        {
            let task = ts::take_shared<Task>(&scenario);
            
            assert_eq(board::task_title(&task), string::utf8(b"Test Task"));
            assert_eq(board::task_description(&task), string::utf8(b"This is a test task"));
            assert_eq(board::task_status(&task), string::utf8(b"To-Do"));
            assert_eq(board::task_due_date(&task), 1704067200000);
            assert_eq(board::task_effort_hours(&task), 8);
            assert_eq(board::task_creator(&task), ADMIN);
            assert!(option::is_none(&board::task_assignee(&task)), 0);
            assert!(option::is_none(&board::task_parent_id(&task)), 1);

            ts::return_shared(task);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_create_subtask() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Create parent task
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::create_task(
                &mut board,
                &contributor_cap,
                b"Parent Task",
                b"This is a parent task",
                b"To-Do",
                1704067200000,
                16,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        // Create subtask
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let mut parent_task = ts::take_shared<Task>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            let parent_id = object::id(&parent_task);

            board::create_subtask(
                &mut board,
                &mut parent_task,
                &contributor_cap,
                b"Subtask 1",
                b"This is a subtask",
                b"To-Do",
                1704067200000,
                4,
                ts::ctx(&mut scenario)
            );

            // Verify parent has subtask
            let subtask_ids = board::task_subtask_ids(&parent_task);
            assert_eq(vector::length(&subtask_ids), 1);

            assert_eq(board::board_total_tasks(&board), 2);

            ts::return_shared(board);
            ts::return_shared(parent_task);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_update_task() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Create task
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::create_task(
                &mut board,
                &contributor_cap,
                b"Original Title",
                b"Original description",
                b"To-Do",
                1704067200000,
                8,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        // Update task
        ts::next_tx(&mut scenario, ADMIN);
        {
            let board = ts::take_shared<Board>(&scenario);
            let mut task = ts::take_shared<Task>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::update_task(
                &board,
                &mut task,
                &contributor_cap,
                b"Updated Title",
                b"Updated description",
                1704153600000,
                16,
                ts::ctx(&mut scenario)
            );

            assert_eq(board::task_title(&task), string::utf8(b"Updated Title"));
            assert_eq(board::task_description(&task), string::utf8(b"Updated description"));
            assert_eq(board::task_due_date(&task), 1704153600000);
            assert_eq(board::task_effort_hours(&task), 16);

            ts::return_shared(board);
            ts::return_shared(task);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_update_task_status() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Create task
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::create_task(
                &mut board,
                &contributor_cap,
                b"Test Task",
                b"Description",
                b"To-Do",
                0,
                8,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        // Update status to In-Progress
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let mut task = ts::take_shared<Task>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::update_task_status(
                &mut board,
                &mut task,
                &contributor_cap,
                b"In-Progress",
                ts::ctx(&mut scenario)
            );

            assert_eq(board::task_status(&task), string::utf8(b"In-Progress"));
            assert_eq(board::board_completed_tasks(&board), 0);

            ts::return_shared(board);
            ts::return_shared(task);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        // Update status to Completed
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let mut task = ts::take_shared<Task>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::update_task_status(
                &mut board,
                &mut task,
                &contributor_cap,
                b"Completed",
                ts::ctx(&mut scenario)
            );

            assert_eq(board::task_status(&task), string::utf8(b"Completed"));
            assert_eq(board::board_completed_tasks(&board), 1);

            ts::return_shared(board);
            ts::return_shared(task);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_assign_task() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Add a member
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::add_member(
                &mut board,
                &admin_cap,
                MEMBER1,
                board::role_contributor(),
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        // Create task
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::create_task(
                &mut board,
                &contributor_cap,
                b"Task to Assign",
                b"Description",
                b"To-Do",
                0,
                8,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        // Assign task
        ts::next_tx(&mut scenario, ADMIN);
        {
            let board = ts::take_shared<Board>(&scenario);
            let mut task = ts::take_shared<Task>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::assign_task(
                &board,
                &mut task,
                &contributor_cap,
                MEMBER1,
                ts::ctx(&mut scenario)
            );

            assert!(option::is_some(&board::task_assignee(&task)), 0);
            assert_eq(*option::borrow(&board::task_assignee(&task)), MEMBER1);

            ts::return_shared(board);
            ts::return_shared(task);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_unassign_task() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Add a member and create/assign task
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::add_member(
                &mut board,
                &admin_cap,
                MEMBER1,
                board::role_contributor(),
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::create_task(
                &mut board,
                &contributor_cap,
                b"Task",
                b"Description",
                b"To-Do",
                0,
                8,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let board = ts::take_shared<Board>(&scenario);
            let mut task = ts::take_shared<Task>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::assign_task(
                &board,
                &mut task,
                &contributor_cap,
                MEMBER1,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_shared(task);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        // Unassign task
        ts::next_tx(&mut scenario, ADMIN);
        {
            let board = ts::take_shared<Board>(&scenario);
            let mut task = ts::take_shared<Task>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::unassign_task(
                &board,
                &mut task,
                &contributor_cap,
                ts::ctx(&mut scenario)
            );

            assert!(option::is_none(&board::task_assignee(&task)), 0);

            ts::return_shared(board);
            ts::return_shared(task);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = board::EInvalidStatus)]
    fun test_create_task_invalid_status_fails() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::create_task(
                &mut board,
                &contributor_cap,
                b"Test Task",
                b"Description",
                b"InvalidStatus", // This status doesn't exist
                0,
                8,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = board::ENotMember)]
    fun test_assign_task_to_non_member_fails() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Create task
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::create_task(
                &mut board,
                &contributor_cap,
                b"Task",
                b"Description",
                b"To-Do",
                0,
                8,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        // Try to assign to non-member
        ts::next_tx(&mut scenario, ADMIN);
        {
            let board = ts::take_shared<Board>(&scenario);
            let mut task = ts::take_shared<Task>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::assign_task(
                &board,
                &mut task,
                &contributor_cap,
                NON_MEMBER, // Not a member
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_shared(task);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }

    // ==================== Access Control Tests ====================

    #[test]
    fun test_contributor_can_create_and_update_tasks() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Add contributor
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);

            board::add_member(
                &mut board,
                &admin_cap,
                MEMBER1,
                board::role_contributor(),
                ts::ctx(&mut scenario)
            );

            ts::return_shared(board);
            ts::return_to_sender(&scenario, admin_cap);
        };

        // Contributor creates task
        ts::next_tx(&mut scenario, MEMBER1);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::create_task(
                &mut board,
                &contributor_cap,
                b"Contributor Task",
                b"Created by contributor",
                b"To-Do",
                0,
                4,
                ts::ctx(&mut scenario)
            );

            assert_eq(board::board_total_tasks(&board), 1);

            ts::return_shared(board);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        // Contributor updates task
        ts::next_tx(&mut scenario, MEMBER1);
        {
            let board = ts::take_shared<Board>(&scenario);
            let mut task = ts::take_shared<Task>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::update_task(
                &board,
                &mut task,
                &contributor_cap,
                b"Updated by Contributor",
                b"Updated description",
                0,
                8,
                ts::ctx(&mut scenario)
            );

            assert_eq(board::task_title(&task), string::utf8(b"Updated by Contributor"));

            ts::return_shared(board);
            ts::return_shared(task);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }

    // ==================== Analytics Tests ====================

    #[test]
    fun test_completed_tasks_counter() {
        let mut scenario = ts::begin(ADMIN);
        setup_board(&mut scenario);

        // Create multiple tasks
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::create_task(&mut board, &contributor_cap, b"Task 1", b"", b"To-Do", 0, 1, ts::ctx(&mut scenario));

            ts::return_shared(board);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::create_task(&mut board, &contributor_cap, b"Task 2", b"", b"To-Do", 0, 1, ts::ctx(&mut scenario));

            ts::return_shared(board);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        // Complete first task
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let mut task = ts::take_shared<Task>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::update_task_status(&mut board, &mut task, &contributor_cap, b"Completed", ts::ctx(&mut scenario));

            assert_eq(board::board_total_tasks(&board), 2);
            assert_eq(board::board_completed_tasks(&board), 1);

            ts::return_shared(board);
            ts::return_shared(task);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        // Reopen task (change from Completed)
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut board = ts::take_shared<Board>(&scenario);
            let mut task = ts::take_shared<Task>(&scenario);
            let contributor_cap = ts::take_from_sender<ContributorCap>(&scenario);

            board::update_task_status(&mut board, &mut task, &contributor_cap, b"In-Progress", ts::ctx(&mut scenario));

            assert_eq(board::board_completed_tasks(&board), 0);

            ts::return_shared(board);
            ts::return_shared(task);
            ts::return_to_sender(&scenario, contributor_cap);
        };

        ts::end(scenario);
    }
}
