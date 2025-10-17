# Workflow MongoDB Atlas

## Démarrage du projet
1. Vérifiez que le fichier `.env` contient la chaîne Atlas :
   ```
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster-url>/worldstocks
   ```
2. Démarrez le backend et le client :
   ```powershell
   node backend/startAll.js
   ```
   - Le backend démarre sur le port 5000
   - Le client démarre sur le port 5173 (ou suivant)

## Migration des données
Pour migrer vos données locales vers Atlas :
```powershell
mongodump --uri="mongodb://127.0.0.1:27018/worldstocks" --out="dump"
mongorestore --uri="mongodb+srv://<user>:<password>@<cluster-url>/worldstocks" dump/worldstocks
```

## Tests
- Pour vérifier la connexion et les transactions :
  ```powershell
  node backend/testTransaction.js
  node backend/reproPlaceOrder.js
  node backend/seed.js
  ```

## Notes
- Plus besoin de démarrer mongod localement.
- La gestion du cluster, des utilisateurs et des backups se fait sur https://cloud.mongodb.com/
- Pour changer la chaîne de connexion, modifiez `.env`.
