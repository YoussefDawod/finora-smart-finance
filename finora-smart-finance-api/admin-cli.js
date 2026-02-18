#!/usr/bin/env node

/**
 * Admin CLI Tool für User-Verwaltung
 * Usage: node admin-cli.js [command] [options]
 */

const API_URL = process.env.API_URL
  ? `${process.env.API_URL}/api`
  : 'http://localhost:5000/api';

const commands = {
  help: () => {
    console.log(`
Admin CLI - User Management Tool
=====================================

Verfügbare Befehle:

  node admin-cli.js stats                    - Zeige User-Statistiken
  node admin-cli.js list                     - Zeige alle Users (max 50)
  node admin-cli.js list --search john       - Suche nach Users
  node admin-cli.js list --verified          - Nur verifizierte Users
  node admin-cli.js get <userId>             - User Details anzeigen
  node admin-cli.js create <name> <pwd> [email] [--verified] - User anlegen
  node admin-cli.js delete <userId>          - User löschen
  node admin-cli.js reset-password <userId>  - Passwort zurücksetzen
  node admin-cli.js clean-all                - ALLE Users löschen (WARNUNG)

Beispiele:

  # Statistiken anzeigen
  node admin-cli.js stats

  # User mit Name "john" suchen
  node admin-cli.js list --search john

  # User-Details
  node admin-cli.js get 60d5ec49f1b2c72b8c8e4f1a

  # Passwort auf "test123" setzen
  node admin-cli.js reset-password 60d5ec49f1b2c72b8c8e4f1a test123

  # User anlegen (verifiziert)
  node admin-cli.js create devuser Dev@123 dev@example.com --verified
`);
  },

  stats: async () => {
    const res = await fetch(`${API_URL}/admin/stats`);
    const data = await res.json();
    
    if (!data.success) {
      console.error('Error:', data.message);
      return;
    }

    const { overview, recentUsers } = data.data;
    console.log('\nUser Statistics');
    console.log('==================');
    console.log(`Total Users:       ${overview.totalUsers}`);
    console.log(`Verified:          ${overview.verifiedUsers}`);
    console.log(`Unverified:        ${overview.unverifiedUsers}`);
    console.log(`Last 7 days:       ${overview.usersLast7Days}`);
    console.log(`Last 30 days:      ${overview.usersLast30Days}`);
    console.log(`Total Transactions: ${overview.totalTransactions}`);
    
    console.log('\nRecent Users:');
    recentUsers.forEach((user, i) => {
      console.log(`  ${i+1}. ${user.name} (${user.email || 'no email'}) - ${user.isVerified ? 'verified' : 'pending'}`);
    });
    console.log('');
  },

  create: async (args) => {
    const name = args[0];
    const password = args[1];
    const email = args[2];
    const isVerified = args.includes('--verified');

    if (!name || !password) {
      console.error('Usage: node admin-cli.js create <name> <pwd> [email] [--verified]');
      return;
    }

    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password, email, isVerified })
    });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message);
      return;
    }

    const user = data.data;
    console.log('User erstellt:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email || 'keine'}`);
    console.log(`   Verifiziert: ${user.isVerified ? 'Ja' : 'Nein'}`);
  },

  list: async (args) => {
    const params = new URLSearchParams({
      limit: 50,
      showSensitive: false
    });

    if (args.includes('--search')) {
      const searchIndex = args.indexOf('--search');
      params.set('search', args[searchIndex + 1] || '');
    }
    if (args.includes('--verified')) {
      params.set('isVerified', 'true');
    }

    const res = await fetch(`${API_URL}/admin/users?${params}`);
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message);
      return;
    }

    const { users, pagination } = data.data;
    console.log(`\nUsers (${pagination.total} total)\n`);
    
    users.forEach((user, i) => {
      console.log(`${i+1}. [${user._id}]`);
      console.log(`   Name: ${user.name}${user.lastName ? ' ' + user.lastName : ''}`);
      console.log(`   Email: ${user.email || 'keine'}`);
      console.log(`   Status: ${user.isVerified ? 'Verifiziert' : 'Nicht verifiziert'}`);
      console.log(`   Erstellt: ${new Date(user.createdAt).toLocaleDateString('de-DE')}`);
      console.log('');
    });
  },

  get: async (args) => {
    const userId = args[0];
    if (!userId) {
      console.error('User-ID fehlt! Usage: node admin-cli.js get <userId>');
      return;
    }

    const res = await fetch(`${API_URL}/admin/users/${userId}`);
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message);
      return;
    }

    const { user, stats } = data.data;
    console.log('\nUser Details');
    console.log('================');
    console.log('ID:           ', user._id);
    console.log('Name:         ', user.name, user.lastName || '');
    console.log('Email:        ', user.email || 'keine');
    console.log('Phone:        ', user.phone || 'keine');
    console.log('Verified:     ', user.isVerified ? 'Ja' : 'Nein');
    console.log('Created:      ', new Date(user.createdAt).toLocaleString('de-DE'));
    console.log('Last Login:   ', user.lastLogin ? new Date(user.lastLogin).toLocaleString('de-DE') : 'nie');
    console.log('Transactions: ', stats.transactionCount);
    console.log('\nPreferences:');
    console.log('  Theme:      ', user.preferences.theme);
    console.log('  Currency:   ', user.preferences.currency);
    console.log('  Language:   ', user.preferences.language);
    console.log('');
  },

  delete: async (args) => {
    const userId = args[0];
    if (!userId) {
      console.error('User-ID fehlt! Usage: node admin-cli.js delete <userId>');
      return;
    }

    console.log('WARNUNG: Lösche User und alle Transaktionen...');
    const res = await fetch(`${API_URL}/admin/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message);
      return;
    }

    console.log('Erfolgreich gelöscht:');
    console.log('   User:', data.data.deletedUser);
    console.log('   Transaktionen:', data.data.deletedTransactions);
  },

  'reset-password': async (args) => {
    const userId = args[0];
    const newPassword = args[1] || 'test123';

    if (!userId) {
      console.error('User-ID fehlt! Usage: node admin-cli.js reset-password <userId> [newPassword]');
      return;
    }

    const res = await fetch(`${API_URL}/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message);
      return;
    }

    console.log('Passwort erfolgreich zurückgesetzt auf:', newPassword);
  },

  'clean-all': async () => {
    console.log('\nWARNUNG: Dies wird ALLE Users und Transaktionen löschen!');
    console.log('Drücke STRG+C zum Abbrechen...\n');

    // In einer echten Anwendung würdest du readline verwenden für Bestätigung
    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE_ALL_USERS' })
    });
    const data = await res.json();

    if (!data.success) {
      console.error('Error:', data.message);
      return;
    }

    console.log('Alle Daten gelöscht:');
    console.log('   Users:', data.data.deletedUsers);
    console.log('   Transaktionen:', data.data.deletedTransactions);
  }
};

// Main
const main = async () => {
  const [,, command, ...args] = process.argv;

  if (!command || command === 'help') {
    commands.help();
    return;
  }

  const cmd = commands[command];
  if (!cmd) {
    console.error(`Unbekannter Befehl: ${command}`);
    console.log('Verwende "node admin-cli.js help" für Hilfe');
    return;
  }

  try {
    await cmd(args);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.cause?.code === 'ECONNREFUSED') {
      console.error('Tipp: Ist der API-Server gestartet? (npm run dev)');
    }
  }
};

main();
