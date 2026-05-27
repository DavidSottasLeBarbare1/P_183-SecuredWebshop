# Rapport
| | |
| :--- | :--- |
| **Candidat** | Sottas David |
| **Lieu de travail** | ETML |
| **Chef de projet** | Gaël Sonney |
| **Nombre de périodes**| 24p |

---

## 1. Introduction

L'objectif de ce projet était de prendre une application web Node.js existante (un web store) et d'y appliquer un ensemble de bonnes pratiques de sécurité, en se basant sur le Top 10 OWASP 2025. Le travail consistait d'abord à réaliser toutes les activités obligatoires, puis à choisir des activités supplémentaires pour atteindre 15 points.

L'application tourne avec Node.js, Express, MySQL et Docker. Elle permet à des utilisateurs de s'inscrire, se connecter, gérer leur profil, et à un administrateur de gérer les comptes.

---

## 2. Activités réalisées

### Activités obligatoires

**Page de login et d'inscription (frontend)**  
Deux pages HTML ont été créées : `login.html` et `register.html`. Elles permettent à l'utilisateur de s'authentifier ou de créer un compte via des formulaires qui communiquent avec l'API backend.

**Remplacement des mots de passe en clair**  
Les mots de passe étaient stockés en clair dans la base de données. Ils sont maintenant hashés avec Argon2id, un algorithme recommandé pour le stockage de mots de passe car il est résistant aux attaques par force brute et aux attaques matérielles.

**Ajout d'un sel**  
Argon2 intègre automatiquement un sel unique par mot de passe. Cela signifie que deux utilisateurs avec le même mot de passe auront des hashs différents, ce qui empêche les attaques par rainbow tables.

**Ajout d'un poivre**  
Un poivre (valeur secrète côté serveur) est ajouté au mot de passe avant le hashage. Contrairement au sel, le poivre n'est pas stocké en base de données mais dans les variables d'environnement. Si la base est compromise sans le serveur, les hashs restent inutilisables.

**Correction des injections SQL**  
Les requêtes utilisaient auparavant la concaténation directe de données utilisateur dans le SQL. Toutes les requêtes ont été refactorisées pour utiliser des paramètres préparés avec le `?`, ce qui empêche toute injection SQL.

**Implémentation des tokens JWT**  
L'authentification repose maintenant sur des tokens JWT. À la connexion, le serveur génère un access token (durée courte) et un refresh token (durée longue) stocké en base de données. Les tokens sont transmis via des cookies `httpOnly`, inaccessibles depuis le JavaScript côté client.

**Rôles dans le JWT et protection des routes admin**  
Le rôle de l'utilisateur (`user` ou `admin`) est inclus dans le payload du JWT. Un middleware `adminSecurity` vérifie ce rôle avant d'autoriser l'accès aux routes d'administration. Un utilisateur normal qui tenterait d'accéder à `/api/admin` reçoit un 403. Les credentials pour le role admin se trouve dans `app/server.js`.

---

### Activités à choix

**Mise en place du HTTPS**
Le serveur Express utilise `https.createServer` avec un certificat auto-signé. Toutes les communications entre le navigateur et le serveur sont chiffrées.

**Politique de mot de passe fort**
La validation des mots de passe est faite avec Joi côté serveur. Un mot de passe doit contenir au minimum 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial. Un indicateur de force est également affiché côté frontend pendant la saisie.

**Token JWT avec durée limitée et refresh token**
L'access token expire après 15 minutes. Un refresh token de longue durée est stocké en base de données. Quand l'access token expire, le client envoie automatiquement le refresh token pour en obtenir un nouveau, sans que l'utilisateur ait besoin de se reconnecter.

**Audit des dépendances NPM**
Un audit de sécurité des packages Node.js installés a été réalisé à l'aide de la commande native `npm audit`. Cet outil permet d'analyser l'arbre des dépendances du projet. Les vulnérabilités détectées ont été corrigées à l'aide de la commande `npm audit fix`, ce qui a permis de mettre à jour automatiquement les paquets concernés vers des versions sécurisées sans introduire de changements majeurs (breaking changes).

**Gestion des exceptions**
Un middleware global de gestion d'erreurs a été ajouté dans `server.js`. En cas d'erreur, le serveur retourne uniquement un message générique au client (`"Erreur serveur"`) et logue le détail technique uniquement côté serveur. Aucun stack trace ni message SQL n'est exposé au client.

**Limitation des tentatives de login (anti brute-force)**
Le package `express-rate-limit` a été intégré sur la route `POST /api/auth/login`. Après 5 tentatives de connexion en moins d'une minute depuis la même IP, les requêtes suivantes reçoivent un 429 avec un message générique. Le compteur se remet à zéro automatiquement après une minute.

**Verrouillage de compte après N échecs**
Deux colonnes ont été ajoutées à la table `users` : `failed_attempts` (compteur d'échecs) et `locked_until` (date de déblocage). Après 5 tentatives échouées, le compte est verrouillé pendant 15 minutes. Le compteur se remet à 0 lors d'une connexion réussie. Un administrateur peut débloquer un compte manuellement via la route `POST /api/admin/users/:id/unlock`.

**Protection XSS**
Deux failles XSS stockées ont été identifiées dans `admin.html` et `profile.html`. Les deux utilisaient `innerHTML` avec des données provenant de la base de données, ce qui permettait à un utilisateur malveillant d'injecter du code JavaScript via son adresse ou son nom. La correction consiste à remplacer tous les `innerHTML` par des `textContent` et la création d'éléments DOM via `createElement`, qui n'interprètent jamais le HTML.

**Principe de moindre privilège sur la BDD**
Deux utilisateurs MySQL distincts ont été créés. `webshop_init` a uniquement les droits DDL (CREATE, ALTER, DROP) et est utilisé lors de l'initialisation du schéma. `webshop_app` a uniquement les droits DML (SELECT, INSERT, UPDATE, DELETE) et est le seul utilisé par l'application Node.js en fonctionnement normal. Ainsi, si l'application est compromise, un attaquant ne peut pas supprimer ou modifier la structure de la base.

---

## 3. Difficultés rencontrées

La mise en place du principe de moindre privilège sur la BDD a nécessité une intervention manuelle directement dans le container MySQL. Le script `init.sql` n'est exécuté qu'à la création du volume Docker, donc il ne rejoue pas si le volume existe déjà. La solution a été de créer les utilisateurs via `docker exec` directement.

Les mots de passe de seed dans `init.sql` étaient en clair. Lors du login avec ces comptes, Argon2 plantait car il essayait de vérifier une chaîne non hashée. Un script one-shot a été écrit pour mettre à jour les hashs en base.

---

## 4. Conclusion

Ce projet a permis de passer en revue les failles de sécurité les plus courantes dans une application web et d'apprendre à les corriger de façon concrète. La majorité des vulnérabilités corrigées sont classées dans le Top 10 OWASP, ce qui montre que ces problèmes sont fréquents et bien documentés.

La sécurité d'une application n'est pas quelque chose qu'on ajoute à la fin, mais quelque chose qui doit être intégré dès la conception. Des erreurs comme l'utilisation de `innerHTML` avec des données utilisateur ou les requêtes SQL concaténées sont faciles à introduire mais peuvent avoir des conséquences importantes.
