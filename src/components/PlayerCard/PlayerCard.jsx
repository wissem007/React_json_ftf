import React from 'react';
import './PlayerCard.css';

const PlayerCard = ({ player }) => {
  // Créer l'URL de l'image si elle existe
  const playerImage = player.photoBdata 
    ? `data:image/jpeg;base64,${player.photoBdata}`
    : null;

  // Calculer l'âge si dateOfBirth est disponible
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="player-card">
      {/* Photo du joueur */}
      <div className="player-photo-container">
        {playerImage ? (
          <img 
            src={playerImage} 
            alt={`${player.name} ${player.lastName}`}
            className="player-photo"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div className="player-photo-placeholder">
            {player.name?.charAt(0)}{player.lastName?.charAt(0)}
          </div>
        )}
      </div>

      {/* Informations du joueur */}
      <div className="player-info">
        <h3 className="player-name">{player.name} {player.lastName}</h3>
        
        <div className="player-meta">
          <span className="player-id">ID: {player.ctIntervenantId}</span>
          <span className="player-age">Âge: {calculateAge(player.dateOfBirth)}</span>
        </div>

        <div className="player-details">
          <p><strong>Licence:</strong> {player.licenceNum || 'N/A'}</p>
          <p><strong>CIN/Passport:</strong> {player.cinNumber || player.passportNum || 'N/A'}</p>
          <p><strong>Lieu de naissance:</strong> {player.placeOfBirth || 'N/A'}</p>
          <p><strong>Équipe ID:</strong> {player.ctTeamId}</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;