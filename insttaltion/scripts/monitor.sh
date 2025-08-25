#!/bin/bash

echo "📊 === STATUS DE L'APPLICATION ==="
echo ""

echo "🐳 Conteneurs Docker:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "💾 Utilisation disque:"
df -h

echo ""
echo "🧠 Utilisation mémoire:"
free -h

echo ""
echo "🌐 Test de connectivité:"
curl -s -o /dev/null -w "Frontend: %{http_code}\n" https://licencesftf.com
curl -s -o /dev/null -w "API: %{http_code}\n" https://api.licencesftf.com/actuator/health

echo ""
echo "📋 Logs récents (dernières 10 lignes):"
docker-compose -f docker-compose.prod.yml logs --tail=10