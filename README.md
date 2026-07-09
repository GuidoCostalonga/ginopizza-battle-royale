# 🍕 Ginopizza Battle Royale 🍕

### ▶️ Gioca ora: **https://ginopizza.github.io/ginopizza-battle-royale/**

Un gioco arcade **battle royale** top-down, colorato e caotico, giocabile direttamente dal browser.
Scegli il tuo personaggio "brainrot", vieni lanciato nell'arena con **20 bot intelligenti** e cerca di
restare l'ultimo in vita! Pensato per essere veloce, assurdo, ironico e super condivisibile.

Realizzato con **HTML5 + CSS3 + JavaScript** e il motore **Phaser 3** (unica dipendenza, caricata da CDN).
Nessun asset esterno: tutta la grafica è generata via codice usando forme, colori ed emoji.

---

## 🚀 Come avviarlo

Il gioco ha bisogno di un piccolo server locale (il browser blocca alcune funzioni sui file aperti
direttamente con `file://`). Scegli **uno** di questi metodi dalla cartella del progetto:

### Opzione A — Python (di solito già installato)
```bash
python -m http.server 8000
```
Poi apri il browser su **http://localhost:8000/index.html**

### Opzione B — Node.js
```bash
npx serve .
# oppure
npx http-server -p 8000
```

### Opzione C — VS Code
Installa l'estensione **Live Server**, poi tasto destro su `index.html` → *"Open with Live Server"*.

> 💡 Serve una connessione a internet **al primo avvio** per scaricare Phaser dalla CDN.

---

## 🎮 Controlli

| Azione | Desktop | Mobile |
|---|---|---|
| Movimento | `WASD` o frecce | Joystick virtuale (in basso a sinistra) |
| Attacco base | `SPAZIO` | Pulsante 👊 |
| Abilità speciale | `E` | Pulsante ✨ |

---

## ✨ Cosa è stato implementato

**Gameplay**
- Movimento fluido con attrito, camera che segue il giocatore, arena quadrata 1500×1500.
- Attacco base ad area frontale + abilità speciale unica per ogni personaggio (con cooldown).
- Barre della vita sopra ogni combattente, indicatore di cooldown e scudo.
- Zona pericolosa che si **restringe** nel tempo (danno fuori dal cerchio sicuro).
- Contatori: timer partita, giocatori rimasti, eliminazioni.
- **Slow motion** quando resta un solo avversario + **camera shake** sugli impatti.

**8 personaggi giocabili** — ognuno con nome, colore, velocità, vita, potere speciale e frase meme:
Capybara DJ, Banana Samurai, Pizza Ninja, Toilet Wizard, Crocodile Boss, Penguin Hacker, Frog Skater, Chicken Astronaut.

**6 power-up** — velocità, cura, scudo, attacco potenziato, invisibilità, bomba meme.

**8 eventi casuali** (ogni 30s) — gravità impazzita, tutti giganti, pioggia di polli esplosivi,
pavimento di ghiaccio, meteoriti, tornado, super velocità, luci disco.

**Arena** — muri/ostacoli con collisioni, cespugli dove nascondersi, zone scivolose di ghiaccio, power-up casuali.

**5 tipi di bot con IA** — aggressivo, difensivo, codardo, cacciatore di power-up, caotico.
I bot si muovono, attaccano, cercano power-up, usano le speciali e fuggono dalla zona che si restringe.

**Interfaccia completa** — schermata iniziale, selezione personaggio + skin, istruzioni, HUD di gioco,
schermata game over con riepilogo (replay testuale), pulsante "Gioca ancora" e classifica locale.

**Progressione** — sistema XP (per partita, kill e piazzamento), **skin cosmetiche** sbloccabili,
tutto salvato in `localStorage`.

**Audio** — effetti generati via **Web Audio API** (attacco, colpo, eliminazione, power-up, evento, vittoria, sconfitta).

**Extra social** — particelle esagerate, mini meme casuali a schermo, pulsante **"Condividi"** che copia
il risultato negli appunti pronto da incollare sui social.

---

## 📂 File del gioco

```
index.html   # Pagina + controlli mobile, carica Phaser da CDN
style.css    # Layout pagina e stile joystick/pulsanti mobile
main.js      # Tutta la logica di gioco (scene, fighter, IA, eventi)
```

---

## 🔮 5 miglioramenti futuri

1. **Multiplayer reale online** con WebSocket (es. Socket.IO + server Node) per sfidare amici veri.
2. **Sprite animati veri** al posto delle emoji, con animazioni di camminata/attacco più espressive.
3. **Più mappe e modalità** (a squadre, deathmatch, mappe con biomi diversi).
4. **Musica di sottofondo** e mixer audio con volume regolabile / mute.
5. **Sfide e ricompense giornaliere** per aumentare la rigiocabilità e la condivisione social.

---

Buon divertimento e che vinca il brainrot più forte! 🧠🔥
