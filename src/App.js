import React, { useState, useEffect } from 'react';
import { Search, Users, Trophy, Calendar, MapPin, Hash, RefreshCw, AlertCircle, ChevronDown, ChevronRight, LogOut, Lock, User } from 'lucide-react';

const App = () => {
  // États pour l'authentification
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // États existants
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('TOUS');
  const [filterTypeInterv, setFilterTypeInterv] = useState('TOUS');
  const [filterLeague, setFilterLeague] = useState('TOUS');
  const [playersData, setPlayersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedLeagues, setExpandedLeagues] = useState(new Set());
  const [expandedTeams, setExpandedTeams] = useState(new Set());

  // Données de connexion temporaires
  const validCredentials = [
    { username: 'admin', password: 'Aloui@_22101984', role: 'Administrateur' },
    { username: 'ftf', password: 'Aloui@_22101984', role: 'Fédération' },
    { username: 'user', password: 'Aloui@_22101984', role: 'Utilisateur' }
  ];

  // Vérifier l'authentification au démarrage
  useEffect(() => {
    const savedAuth = localStorage.getItem('ftf_auth');
    if (savedAuth) {
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  // Fonction de connexion
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    // Simulation d'une requête de connexion
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = validCredentials.find(
      cred => cred.username === loginForm.username && cred.password === loginForm.password
    );

    if (user) {
      localStorage.setItem('ftf_auth', JSON.stringify({ username: user.username, role: user.role }));
      setIsAuthenticated(true);
      loadPlayersData();
    } else {
      setLoginError('Nom d\'utilisateur ou mot de passe incorrect');
    }
    
    setIsLoggingIn(false);
  };

  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('ftf_auth');
    setIsAuthenticated(false);
    setPlayersData([]);
    setLoginForm({ username: '', password: '' });
    setLoginError('');
  };

  // Fonction pour charger les données JSON
  const loadPlayersData = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/data/players.json');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ajout de la photo pour le joueur spécifique
      const updatedData = data.map(player => {
        if (player.numLicence === "910919010") {
          return {
            ...player,
            photo: "/images/910919010.jpeg"
          };
        }
        return player;
      });
      
      setPlayersData(updatedData);
      setLastUpdated(new Date().toLocaleString('fr-FR'));
      
      // Expand all leagues and teams by default
      const leagues = new Set(updatedData.map(player => player.division));
      const teams = new Set(updatedData.map(player => `${player.division}-${player.teamInitial}`));
      setExpandedLeagues(leagues);
      setExpandedTeams(teams);
    } catch (err) {
      setError(`Erreur lors du chargement des données: ${err.message}`);
      console.error('Erreur de chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données si authentifié
  useEffect(() => {
    if (isAuthenticated) {
      loadPlayersData();
    }
  }, [isAuthenticated]);

  // Fonction pour calculer l'âge
  const calculateAge = (dateNaissance) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Filtrage des joueurs
  const filteredPlayers = playersData.filter(player => {
    const matchesSearch = 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.playerNum && player.playerNum.toString().includes(searchTerm)) ||
      player.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'TOUS' || player.categorie === filterCategory;
    const matchesType = filterTypeInterv === 'TOUS' || player.typeInterv === filterTypeInterv;
    const matchesLeague = filterLeague === 'TOUS' || player.division === filterLeague;
    
    return matchesSearch && matchesCategory && matchesType && matchesLeague;
  });

  // Organiser les données par ligue puis par équipe
  const organizedData = filteredPlayers.reduce((acc, player) => {
    const league = player.division || 'Non spécifiée';
    const team = player.teamName || 'Équipe inconnue';
    const teamInitial = player.teamInitial || 'N/A';
    
    if (!acc[league]) {
      acc[league] = {};
    }
    
    if (!acc[league][team]) {
      acc[league][team] = {
        teamInitial,
        players: []
      };
    }
    
    acc[league][team].players.push(player);
    
    return acc;
  }, {});

  // Obtenir les catégories, types et ligues uniques
  const categories = ['TOUS', ...new Set(playersData.map(player => player.categorie))];
  const typeIntervs = ['TOUS', ...new Set(playersData.map(player => player.typeInterv))];
  const leagues = ['TOUS', ...new Set(playersData.map(player => player.division))];

  // Fonctions pour gérer l'expansion/contraction
  const toggleLeague = (league) => {
    const newExpanded = new Set(expandedLeagues);
    if (newExpanded.has(league)) {
      newExpanded.delete(league);
    } else {
      newExpanded.add(league);
    }
    setExpandedLeagues(newExpanded);
  };

  const toggleTeam = (teamKey) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamKey)) {
      newExpanded.delete(teamKey);
    } else {
      newExpanded.add(teamKey);
    }
    setExpandedTeams(newExpanded);
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('TOUS');
    setFilterTypeInterv('TOUS');
    setFilterLeague('TOUS');
  };

  // Page de connexion
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500 mx-auto mb-4">
              <img 
                src="/images/ftf-logo.png" 
                alt="Logo FTF" 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="bg-red-500 text-white w-16 h-16 rounded-full hidden items-center justify-center font-bold text-2xl">
                FTF
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Fédération Tunisienne de Football</h1>
            <p className="text-gray-600">Connexion au système de gestion</p>
          </div>

          {/* Formulaire de connexion */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  required
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Entrez votre nom d'utilisateur"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Entrez votre mot de passe"
                />
              </div>
            </div>

            {/* Message d'erreur */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Lock size={20} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Informations de test */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Comptes de test :</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Admin :</strong> admin / Aloui@_22101984</div>
              <div><strong>FTF :</strong> ftf / Aloui@_22101984</div>
              <div><strong>User :</strong> user / Aloui@_22101984</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Composant de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={48} />
          <h2 className="text-xl font-semibold text-gray-700">Chargement des données...</h2>
        </div>
      </div>
    );
  }

  // Composant d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadPlayersData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Interface principale (après connexion)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-red-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-red-500">
                <img 
                  src="/images/ftf-logo.png" 
                  alt="Logo FTF" 
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="bg-red-500 text-white w-12 h-12 rounded-full hidden items-center justify-center font-bold text-xl">
                  FTF
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Fédération Tunisienne de Football</h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <Trophy size={16} />
                  Organisation par Ligue et Club
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="bg-red-100 px-4 py-2 rounded-lg mb-2">
                  <p className="text-red-800 font-semibold">{filteredPlayers.length} Personnes</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={loadPlayersData}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
                    title="Actualiser les données"
                  >
                    <RefreshCw size={14} />
                    Actualiser
                  </button>
                  <button
                    onClick={resetFilters}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
                    title="Réinitialiser les filtres"
                  >
                    <RefreshCw size={14} />
                    Réinitialiser
                  </button>
                </div>
              </div>
              
              {/* Bouton de déconnexion */}
              <div className="border-l pl-4">
                <div className="text-sm text-gray-600 mb-1">
                  Connecté en tant que : <span className="font-semibold">{JSON.parse(localStorage.getItem('ftf_auth') || '{}').username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                >
                  <LogOut size={14} />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
          
          {/* Indicateur de dernière mise à jour */}
          {lastUpdated && (
            <div className="mt-4 text-sm text-gray-500">
              Dernière mise à jour : {lastUpdated}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher (nom, équipe, numéro...)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filtre pour les ligues */}
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterLeague}
              onChange={(e) => setFilterLeague(e.target.value)}
            >
              {leagues.map(league => (
                <option key={league} value={league}>Ligue: {league}</option>
              ))}
            </select>
            
            {/* Filtre pour les catégories */}
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>Catégorie: {category}</option>
              ))}
            </select>
            
            {/* Filtre pour les types */}
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterTypeInterv}
              onChange={(e) => setFilterTypeInterv(e.target.value)}
            >
              {typeIntervs.map(type => (
                <option key={type} value={type}>Type: {type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Affichage organisé par ligue et équipe */}
        <div className="space-y-6">
          {Object.entries(organizedData).map(([league, teams]) => {
            const isLeagueExpanded = expandedLeagues.has(league);
            const totalPlayersInLeague = Object.values(teams).reduce((sum, team) => sum + team.players.length, 0);
            
            return (
              <div key={league} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header de la ligue */}
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 cursor-pointer hover:from-indigo-600 hover:to-purple-700 transition-colors"
                  onClick={() => toggleLeague(league)}
                >
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-3">
                      {isLeagueExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <Trophy size={24} />
                      <div>
                        <h2 className="text-xl font-bold">{league}</h2>
                        <p className="text-indigo-100">{Object.keys(teams).length} équipe(s) - {totalPlayersInLeague} personne(s)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Équipes de la ligue */}
                {isLeagueExpanded && (
                  <div className="divide-y divide-gray-200">
                    {Object.entries(teams).map(([teamName, teamData]) => {
                      const teamKey = `${league}-${teamData.teamInitial}`;
                      const isTeamExpanded = expandedTeams.has(teamKey);
                      
                      return (
                        <div key={teamName} className="bg-gray-50">
                          {/* Header de l'équipe */}
                          <div 
                            className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleTeam(teamKey)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {isTeamExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {teamData.teamInitial}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{teamName}</h3>
                                  <p className="text-sm text-gray-600">{teamData.players.length} personne(s)</p>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                Joueurs: {teamData.players.filter(p => p.typeInterv === 'Joueur').length} | 
                                Dirigeants: {teamData.players.filter(p => p.typeInterv === 'Dirigeant').length}
                              </div>
                            </div>
                          </div>

                          {/* Joueurs de l'équipe */}
                          {isTeamExpanded && (
                            <div className="px-4 pb-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {teamData.players.map((player, index) => (
                                  <div key={`${player.numLicence}-${index}`} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300 overflow-hidden">
                                    {/* Header de la carte */}
                                    <div className={`p-3 text-white ${player.typeInterv === 'Joueur' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'}`}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                            {player.numLicence === "910919010" ? (
                                              <img src="/images/910919010.jpeg" alt={`${player.name} ${player.lastName}`} className="w-6 h-6 rounded-full" />
                                            ) : player.photo ? (
                                              <img src={player.photo} alt={`${player.name} ${player.lastName}`} className="w-6 h-6 rounded-full" />
                                            ) : (
                                              <Users size={16} />
                                            )}
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-sm">{player.name}</h4>
                                            <p className="text-xs opacity-90">{player.lastName}</p>
                                          </div>
                                        </div>
                                        {player.playerNum && (
                                          <div className="bg-white bg-opacity-20 rounded px-2 py-1">
                                            <span className="text-sm font-bold">#{player.playerNum}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Corps de la carte */}
                                    <div className="p-3 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          player.typeInterv === 'Joueur'
                                            ? player.categorie === 'ELITE' 
                                              ? 'bg-yellow-100 text-yellow-800' 
                                              : 'bg-blue-100 text-blue-800'
                                            : 'bg-orange-100 text-orange-800'
                                        }`}>
                                          {player.typeInterv} - {player.categorie}
                                        </span>
                                        <span className="text-gray-500 text-xs">{calculateAge(player.dateNaissance)} ans</span>
                                      </div>

                                      <div className="space-y-1 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                          <Hash size={10} />
                                          <span>{player.numLicence}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Calendar size={10} />
                                          <span>{formatDate(player.dateNaissance)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MapPin size={10} />
                                          <span>{player.nationalite}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Message si aucun résultat */}
        {filteredPlayers.length === 0 && playersData.length > 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune personne trouvée</h3>
            <p className="text-gray-600">Essayez de modifier votre recherche ou vos filtres.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-2">Fédération Tunisienne de Football</h4>
            <p className="text-gray-400">Organisation par Ligue et Club - Saison 2024/2025</p>
            <p className="text-gray-500 text-sm mt-2">
              Données chargées dynamiquement depuis players.json
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;