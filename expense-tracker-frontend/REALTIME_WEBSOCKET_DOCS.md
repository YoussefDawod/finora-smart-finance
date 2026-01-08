# Real-time WebSocket Integration Documentation

## Übersicht

Das Real-time WebSocket System basiert auf Socket.io und bietet:
- ✅ Live-Synchronisation von Expense-Daten
- ✅ Optimistic Updates mit automatischem Rollback
- ✅ Conflict Resolution mit verschiedenen Strategien
- ✅ Offline Queue für ausstehende Events
- ✅ Connection Management mit Auto-Reconnect
- ✅ Latency Tracking und Heartbeat

## Setup

### 1. Environment Variables

```env
VITE_SOCKET_URL=http://localhost:3000
```

### 2. Socket Service

```javascript
import { socketService } from './services/socketService';

// Connect to default namespace
socketService.connect();

// Connect to specific namespace
socketService.connect('/expenses');

// Check connection status
const { connected, latency, reconnectAttempts } = socketService.getStatus();

// Disconnect
socketService.disconnect();
```

## Hooks

### useRealtimeSync

Synchronisiert Expenses in Echtzeit:

```javascript
import { useRealtimeSync } from './hooks/useRealtimeSync';

function MyComponent() {
  const { connect, disconnect, requestFullSync, isConnected } = useRealtimeSync({
    onExpenseCreated: (data) => {
      console.log('New expense:', data);
    },
    onExpenseUpdated: (data) => {
      console.log('Updated expense:', data);
    },
    onExpenseDeleted: (data) => {
      console.log('Deleted expense:', data);
    },
    onSyncConflict: (data) => {
      console.log('Conflict detected:', data);
    },
    autoConnect: true,
  });

  return (
    <div>
      {isConnected ? 'Connected' : 'Disconnected'}
      <button onClick={requestFullSync}>Force Sync</button>
    </div>
  );
}
```

### useOptimisticUpdate

Ermöglicht optimistische UI-Updates:

```javascript
import { useOptimisticUpdate } from './hooks/useOptimisticUpdate';
import { optimisticAdd, optimisticUpdate, optimisticDelete } from './utils/optimisticHandlers';

function MyComponent() {
  const [expenses, setExpenses] = useState([]);

  const { createOptimisticUpdate, isPending, pendingCount } = useOptimisticUpdate({
    onSuccess: (id, result) => console.log('Success:', id),
    onError: (id, error) => console.error('Error:', id, error),
    onRollback: (id, snapshot) => console.log('Rolled back:', id),
  });

  const addExpense = async (newExpense) => {
    const rollback = optimisticAdd(expenses, newExpense, setExpenses);

    await createOptimisticUpdate(
      'add_expense',
      () => Promise.resolve(), // Optimistic UI already applied
      'expense:create',
      newExpense,
      rollback
    );
  };

  const updateExpense = async (id, updates) => {
    const rollback = optimisticUpdate(expenses, id, updates, setExpenses);

    await createOptimisticUpdate(
      `update_${id}`,
      () => Promise.resolve(),
      'expense:update',
      { id, ...updates },
      rollback
    );
  };

  const deleteExpense = async (id) => {
    const rollback = optimisticDelete(expenses, id, setExpenses);

    await createOptimisticUpdate(
      `delete_${id}`,
      () => Promise.resolve(),
      'expense:delete',
      { id },
      rollback
    );
  };

  return (
    <div>
      {pendingCount > 0 && <p>{pendingCount} pending updates</p>}
      {/* Expense list */}
    </div>
  );
}
```

### useSyncState

Verwaltet Synchronisationsstatus mit Conflict Resolution:

```javascript
import { useSyncState } from './hooks/useSyncState';
import { CONFLICT_STRATEGIES } from './utils/conflictResolution';

function MyComponent() {
  const [expenses, setExpenses] = useState([]);

  const {
    isSyncing,
    lastSyncTime,
    syncError,
    conflicts,
    hasChanges,
    requestFullSync,
    resolveConflict,
  } = useSyncState({
    localData: expenses,
    onSync: (syncedData) => setExpenses(syncedData),
    onConflict: (conflicts) => console.warn('Conflicts:', conflicts),
    strategy: CONFLICT_STRATEGIES.LAST_WRITE_WINS,
    autoSync: true,
  });

  return (
    <div>
      {isSyncing && <p>Syncing...</p>}
      {syncError && <p>Error: {syncError}</p>}
      {conflicts.length > 0 && (
        <div>
          <p>{conflicts.length} conflicts detected</p>
          {conflicts.map((conflict) => (
            <button key={conflict.id} onClick={() => resolveConflict(conflict.id, conflict.winner)}>
              Resolve {conflict.id}
            </button>
          ))}
        </div>
      )}
      {hasChanges && <button onClick={requestFullSync}>Sync Changes</button>}
    </div>
  );
}
```

### useConnectionStatus

Überwacht WebSocket-Verbindungsstatus:

```javascript
import { useConnectionStatus } from './hooks/useConnectionStatus';

function MyComponent() {
  const {
    connectionState,
    isConnected,
    isReconnecting,
    latency,
    reconnectAttempts,
    lastError,
    retry,
  } = useConnectionStatus({
    onConnect: () => console.log('Connected'),
    onDisconnect: (reason) => console.log('Disconnected:', reason),
    onReconnecting: (attempt) => console.log('Reconnecting:', attempt),
    onError: (error) => console.error('Connection error:', error),
  });

  return (
    <div>
      <p>Status: {connectionState}</p>
      <p>Latency: {latency}ms</p>
      {isReconnecting && <p>Reconnecting... ({reconnectAttempts})</p>}
      {lastError && <p>Error: {lastError.message}</p>}
      {!isConnected && <button onClick={retry}>Retry</button>}
    </div>
  );
}
```

## Components

### ConnectionStatus

Zeigt aktuellen Verbindungsstatus:

```javascript
import { ConnectionStatus } from './components/connection';

function App() {
  return (
    <>
      <ConnectionStatus 
        showWhenConnected={true} 
        position="top-right" 
      />
      {/* Rest of app */}
    </>
  );
}
```

### OfflineBanner

Banner für Offline-Status:

```javascript
import { OfflineBanner } from './components/connection';

function App() {
  return (
    <>
      <OfflineBanner 
        showReconnecting={true}
        message="You are offline. Changes will be synced later."
      />
      {/* Rest of app */}
    </>
  );
}
```

### SyncStatus

Sync-Status-Indikator:

```javascript
import { SyncStatus } from './components/connection';

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);

  return (
    <div>
      <SyncStatus
        localData={expenses}
        onSync={(data) => setExpenses(data)}
        onConflict={(conflicts) => console.warn(conflicts)}
        showWhenSynced={true}
      />
      {/* Expense list */}
    </div>
  );
}
```

## Offline Queue

Das System queued automatisch Events bei Offline-Status:

```javascript
import { eventQueue, emitWithQueue, processOfflineQueue } from './utils/realtimeEvents';

// Emit with automatic queuing
await emitWithQueue(socketService, 'expense:create', data, { queueIfOffline: true });

// Check queue size
console.log('Queue size:', eventQueue.size());

// Process queue when back online
await processOfflineQueue(socketService);

// Clear queue
eventQueue.clear();
```

## Conflict Resolution

Verschiedene Strategien für Konfliktlösung:

```javascript
import {
  CONFLICT_STRATEGIES,
  mergeWithConflictResolution,
  detectConflicts,
} from './utils/conflictResolution';

// Detect conflicts
const conflicts = detectConflicts(localExpenses, remoteExpenses);

// Merge with strategy
const { items, conflicts, resolutions } = mergeWithConflictResolution(
  localExpenses,
  remoteExpenses,
  { 
    strategy: CONFLICT_STRATEGIES.LAST_WRITE_WINS,
    idField: 'id',
    timestampField: 'updatedAt',
  }
);

// Available strategies:
// - LAST_WRITE_WINS (default)
// - CLIENT_WINS
// - SERVER_WINS
// - MANUAL
```

## Backend Integration

### Expected Server Events

```javascript
// Server emits:
socket.emit('expense:created', { id, amount, description, createdAt, updatedAt });
socket.emit('expense:updated', { id, amount, description, updatedAt });
socket.emit('expense:deleted', { id });
socket.emit('sync:conflict', { id, local, remote });
socket.emit('sync:full-sync', { items: [...] });

// Client listens:
socket.on('expense:created', handler);
socket.on('expense:updated', handler);
socket.on('expense:deleted', handler);
socket.on('sync:conflict', handler);
socket.on('sync:full-sync', handler);

// Client emits:
socket.emit('expense:create', { amount, description });
socket.emit('expense:update', { id, amount, description });
socket.emit('expense:delete', { id });
socket.emit('sync:request-full-sync', { timestamp });
socket.emit('sync:push-changes', { changes });
```

### Server Configuration

```javascript
// Backend: server.js
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

const expensesNamespace = io.of('/expenses');

expensesNamespace.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('expense:create', async (data, callback) => {
    try {
      const expense = await createExpense(data);
      // Broadcast to all clients
      expensesNamespace.emit('expense:created', expense);
      callback({ success: true, data: expense });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('sync:request-full-sync', async (data, callback) => {
    try {
      const expenses = await getAllExpenses();
      callback({ success: true, data: expenses });
    } catch (error) {
      callback({ error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
```

## Best Practices

1. **Connection Lifecycle**: Immer in `useEffect` connecten/disconnecten
2. **Event Cleanup**: Alle Listener in cleanup functions entfernen
3. **Optimistic Updates**: Immer Rollback-Funktion bereitstellen
4. **Conflict Resolution**: Last-write-wins als Default, Manual für kritische Daten
5. **Offline Support**: Queue aktivieren für alle wichtigen Operations
6. **Error Handling**: onError callbacks implementieren
7. **Performance**: Debounce bei häufigen Updates
8. **Security**: Backend-Validierung aller Socket-Events

## Troubleshooting

### Connection Failed
- ✅ Check VITE_SOCKET_URL environment variable
- ✅ Verify backend is running
- ✅ Check CORS configuration

### Events Not Received
- ✅ Verify namespace (default vs. /expenses)
- ✅ Check event name spelling
- ✅ Ensure listener registered before event emitted

### Offline Queue Not Processing
- ✅ Call processOfflineQueue() after reconnect
- ✅ Check localStorage for queue persistence
- ✅ Verify queue size with eventQueue.size()

### Conflicts Not Resolving
- ✅ Ensure updatedAt timestamp exists
- ✅ Check conflict strategy configuration
- ✅ Verify onConflict callback registered
