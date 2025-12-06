# Bounty Board - On-Chain Task Management System

A decentralized task management and coordination system built on **Sui Network** using **Move** smart contracts and a polished **React** frontend.

![Sui Network](https://img.shields.io/badge/Sui-Testnet-00D4FF?style=flat-square)
![Move](https://img.shields.io/badge/Move-Smart%20Contracts-purple?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)

## Features

### Core Features
- **Board Creation**: Create workspace boards with name and description
- **Role-Based Access Control**: 
  - **Administrators**: Manage members, configure workflows, full access
  - **Contributors**: Create and update tasks
- **Task Management**: 
  - Create tasks with title, description, due date, effort estimation
  - Single assignee support
  - Mutable on-chain attributes
- **Membership**: Add members to boards with role-based permissions

### Bonus Features Implemented
- ✅ **Configurable Workflow**: Custom statuses per board
- ✅ **Hierarchical Tasks**: Parent/child subtask relationships
- ✅ **Board Analytics**: Task counts, completion tracking

## Architecture

### Smart Contract Design (Option B - Separate Shared Objects)

```
Board (Shared Object)
├── id: UID
├── name: String
├── description: String
├── owner: address
├── members: Table<address, u8>  (role mapping)
├── statuses: vector<String>     (custom workflow)
├── task_ids: vector<ID>
├── total_tasks: u64
├── completed_tasks: u64
└── created_at: u64

Task (Shared Object - Separate)
├── id: UID
├── board_id: ID
├── title: String
├── description: String
├── status: String
├── assignee: Option<address>
├── due_date: u64              (Unix timestamp)
├── effort_hours: u64
├── parent_task_id: Option<ID> (for hierarchical tasks)
├── subtask_ids: vector<ID>
├── creator: address
├── created_at: u64
└── updated_at: u64

AdminCap (Owned Object)
├── id: UID
└── board_id: ID

ContributorCap (Owned Object)
├── id: UID
└── board_id: ID
```

### Why Option B?
- **Scalability**: Tasks as separate shared objects allow parallel transactions
- **Flexibility**: Independent task lifecycle management
- **Gas Efficiency**: Only load the objects you need
- **Capability-based Security**: AdminCap and ContributorCap ensure proper authorization

## Project Structure

```
bounty-board/
├── move/
│   ├── Move.toml
│   ├── sources/
│   │   └── board.move          # Main smart contract
│   └── tests/
│       └── board_tests.move    # Comprehensive tests
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx            # Entry point with Sui providers
        ├── App.tsx             # Main app component
        ├── index.css           # Tailwind + custom styles
        ├── types.ts            # TypeScript definitions
        ├── constants.ts        # Contract configuration
        ├── hooks/
        │   └── useSui.ts       # Sui blockchain hooks
        └── components/
            ├── Header.tsx      # Navigation + wallet connect
            ├── Landing.tsx     # Landing page for new users
            ├── BoardList.tsx   # Board grid view
            ├── KanbanBoard.tsx # Kanban task board
            └── Modals.tsx      # Create/Edit modals
```

## Getting Started

### Prerequisites
- [Sui CLI](https://docs.sui.io/build/install) installed
- [Node.js](https://nodejs.org/) v18+
- [Slush Wallet](https://slush.app/) or another Sui wallet

### 1. Deploy Smart Contract

```bash
cd move

# Build the contract
sui move build

# Deploy to testnet
sui client publish --gas-budget 100000000

# Note the Package ID from the output
```

### 2. Configure Frontend

Update the `PACKAGE_ID` in `frontend/src/constants.ts`:

```typescript
export const PACKAGE_ID = '0x_YOUR_PACKAGE_ID_HERE';
```

### 3. Run Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Connect Wallet

1. Open http://localhost:5173
2. Click "Connect Wallet"
3. Select Slush (or your preferred Sui wallet)
4. Approve the connection

## Smart Contract Functions

### Board Management
| Function | Access | Description |
|----------|--------|-------------|
| `create_board` | Anyone | Create a new board |
| `update_board` | Admin | Update board name/description |
| `add_status` | Admin | Add custom workflow status |
| `remove_status` | Admin | Remove workflow status |

### Member Management
| Function | Access | Description |
|----------|--------|-------------|
| `add_member` | Admin | Add member with role |
| `remove_member` | Admin | Remove member from board |
| `update_member_role` | Admin | Change member's role |

### Task Management
| Function | Access | Description |
|----------|--------|-------------|
| `create_task` | Contributor | Create a new task |
| `create_subtask` | Contributor | Create subtask under parent |
| `update_task` | Contributor | Update task details |
| `update_task_status` | Contributor | Change task status |
| `assign_task` | Contributor | Assign task to member |
| `unassign_task` | Contributor | Remove assignment |

## Events

The contract emits events for all major operations:
- `BoardCreated`
- `MemberAdded` / `MemberRemoved` / `MemberRoleUpdated`
- `TaskCreated` / `TaskUpdated`
- `TaskStatusChanged` / `TaskAssigned`
- `StatusAdded` / `StatusRemoved`
- `SubtaskCreated`

## Testing

Run the Move tests:

```bash
cd move
sui move test
```

Test coverage includes:
- Board creation and updates
- Member management (add, remove, role changes)
- Status management (add, remove custom statuses)
- Task CRUD operations
- Subtask creation and hierarchy
- Access control enforcement
- Analytics tracking (completion counters)

## Frontend Features

### UI/UX
- **Dark Theme**: Obsidian-inspired with neon accents
- **Responsive**: Works on desktop and mobile
- **Animations**: Smooth transitions with Framer Motion
- **Drag & Drop**: Change task status by dragging (visual feedback)

### Wallet Integration
- **Sui dApp Kit**: Official Sui wallet integration
- **Slush Support**: Works with Slush and other Sui wallets
- **Auto-connect**: Remembers wallet connection

### Views
1. **Landing Page**: Introduction for non-connected users
2. **Board List**: Grid of user's boards with stats
3. **Kanban Board**: Column-based task visualization
4. **Modals**: Create/edit forms with validation

## Technology Stack

### Smart Contract
- **Move**: Sui's smart contract language
- **Sui Framework**: Standard library and primitives

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations
- **@mysten/dapp-kit**: Sui wallet integration
- **@tanstack/react-query**: Data fetching
- **date-fns**: Date formatting
- **lucide-react**: Icons

## Configuration Options

### Default Statuses
New boards come with default statuses:
- To-Do
- In-Progress
- Blocked
- Completed

Administrators can customize these per board.

### Roles
| Role | Value | Permissions |
|------|-------|-------------|
| Contributor | 1 | Create/update tasks |
| Administrator | 2 | All contributor permissions + member/config management |

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

---

Built with ❤️ for the Sui ecosystem
