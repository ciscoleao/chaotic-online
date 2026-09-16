# 🗺️ Mapas separados de verdade + scan consertado

**Chaotic.IdleWorld · v2.21** · aplicado em `chaotic_idleworld_v123.html`
(continua com o mesmo nome do arquivo — é só substituir o antigo)

---

## 1. O que você relatou

> *"Eu estava no Bosque e meu amigo nas Cavernas (dois mapas diferentes) e a gente ainda
> conseguia se ver, como se só tivesse mudado as cores dos mapas, mas estávamos no mesmo lugar.
> E os monstros eram todos os mesmos. E eu não consegui scanear ninguém, mesmo a criatura
> passando do meu lado — meu personagem não seguia a criatura nem tentava scanear."*

Os dois problemas existiam mesmo, e eram **três coisas diferentes**:

| # | O que você viu | Causa real |
|---|---|---|
| 1 | Jogadores em mapas diferentes se vendo (e o chat **PERTO** misturado) | o online identificava a sala por `GameState.location`, que vale **`'perim'` para TODOS os mapas**. Ou seja: para o servidor, Bosque Verdejante e Cavernas de Brasas eram a **mesma sala** |
| 2 | "Parecia o mesmo lugar com outra cor" | o terreno (rio, lagos, pedras, árvores) era **sorteado do zero a cada viagem**, sem semente. Dois mapas pequenos saíam com o mesmo "clima" de relevo e pareciam o mesmo lugar repintado |
| 3 | Não dava para escanear, ninguém para escanear, monstros iguais | (a) o herói do Auto-Move mirava **pontos fora do mapa** (as metas usavam o tamanho do Pórtico, 3200×2400, em mapas de 2000×1500) e ficava batendo na borda; (b) havia só **2 criaturas** por mapa, vivendo **20 s** cada; (c) quando o scan começava, a criatura **continuava andando** e saía do alcance de 96 px antes dos 3 s de carga — o scan era cancelado com *"Alvo fugiu!"* |

---

## 2. O que mudou (v2.21)

### 2.1 Cada mapa é um mapa (online)
- O jogo agora manda para o servidor o **id da região** como sala: `ow_grove`, `uw_ember`,
  `dan_hive`, `mip_oasis`, `lava_cave`, `time_ruins`… (e `portico`, `exterior`, `drome`, `cave`
  continuam como salas próprias).
- Consequências:
  - você **não vê** mais quem está em outro mapa (nem o nome flutuante, nem o sprite);
  - o chat **PERTO** só conversa **com quem está no mesmo mapa** (o servidor já filtrava por esse
    campo — o problema era o valor que o jogo mandava);
  - ao trocar de mapa, os sprites de quem ficou no mapa antigo **somem na hora**.
- Nenhuma mudança foi necessária no servidor — ele sempre guardou o campo; agora recebe o valor certo.

### 2.2 Cada mapa tem o SEU terreno (e sempre o mesmo)
- A geração do relevo usa uma **semente derivada do id da região**. Resultado:
  - o Bosque Verdejante é **sempre o mesmo bosque** (você reconhece onde está e onde ficam os lagos);
  - Cavernas de Brasas **não é** o Bosque repintado: rio, lagos, mata e pedras saem em outro desenho;
  - a cor/atmosfera continua sendo o tema da tribo (lava, âmbar, areia, névoa…).

### 2.3 Criaturas: dá para achar e dá para escanear
- **Densidade por área**: mínimo **6** e máximo **22** criaturas por mapa (mapa 1 sai com 6 — antes: 2).
- **Vida útil 45 s** (era 20 s) e **percepção de 200 px** (era 160 px): o herói enxerga a criatura antes.
- **A criatura PARA enquanto é escaneada** — não foge mais no meio da barra. Alcance do scan: **130 px**.
- Quem está sendo escaneado **não desaparece** por fim de vida no meio do scan.
- **Auto-Move corrigido**: as metas de caminhada agora respeitam o tamanho **do mapa atual**
  (o problema que fazia o herói "não seguir a criatura" era ele andando contra a borda do mapa).

### 2.4 Monstros por mapa (o que você encontra em cada lugar)
| Mapa | Criaturas |
|---|---|
| 🛡 **Bosque Verdejante** (OverWorld 1) | Slime Verde, Lobo Cinzento, Escudeiro de Perim, Aranha Gigante |
| 🔥 **Cavernas de Brasas** (UnderWorld 1) | Esqueleto, Bruto Subterrâneo, Chamão do Caos, Gárgula de Perim |
| 🐝 **Túneis do Monte Pillar** (Danian 1) | Mandiblor Daniano, Vespa Daniana, Aranha Gigante, Sombra |
| 🏜 **Oásis Enfumaçado** (Mipedian 1) | Batedor Mipediano, Encantador Mipediano, Maré M'arriliana, Dragão Jovem |
| 🌊 **Lagoa Negra M'arrillian** (Lv.40) | Maré/Devorador M'arriliano, Sombra, Senhor do Vazio, Sentinela Eterna, Flagelo Abissal |
| *mapas 2 e 3 de cada tribo* | pools próprios, com **2 espécies agressivas** (Prado Verde, Caverna de Lava, Pântano Nebuloso, etc.) |

> Nas **Safe Zones** (mapa 1 de cada tribo) os monstros são pacíficos: o herói idle caça e escaneia
> em paz. Nos mapas 2+ existem agressivos — aí ele foge/stalka e escaneia na "beirada" da área de ameaça.

---

## 3. Como testar com um amigo (5 minutos)

```
1) Os dois entram pelo site, cada um com o seu personagem;
2) um vai para o BOSQUE VERDEJANTE e o outro para as CAVERNAS DE BRASAS (Portal de Viagem);
   → cada um deve estar SOZINHO na tela (ninguém do outro mapa aparece);
3) o do bosque escreve no chat na aba PERTO — o outro NÃO recebe (mapas diferentes);
4) os dois vão para o MESMO mapa: agora um vê o outro andando, com o nome em cima;
5) ligue o Auto-Move (tecla P) e observe: o herói encontra criaturas, chega perto e a barra
   SCANNING completa — o Scan Card aparece com o código de 12 letras;
6) abra o Portal de Viagem e olhe o relevo: cada mapa tem o seu desenho.
```

---

## 4. Testes feitos (Chrome real, no arquivo final, servidor Node de verdade)

```
A) DUAS CONTAS EM MAPAS DIFERENTES (Bosque × Cavernas)
   • presença no servidor .... "NTA@ow_grove" × "NTB@uw_ember" ✓ (antes: os dois "perim")
   • se vêem? ............... NÃO ✓ (0 sprites do outro em cada tela)
   • criaturas no mapa ...... Bosque: Lobo/Slime/Escudeiro/Aranha (5) × Cavernas: Bruto/Chamão/Gárgula ✓
B) MESMO MAPA
   • os dois no bosque ...... um VÊ o outro (sprite + nome) ✓
   • B volta às cavernas .... o sprite dele DESAPARECE na tela do A na hora ✓
   • chat PERTO ............. A no bosque fala e B (nas cavernas) não recebe ✓;
                              B indo para o bosque volta a receber ✓
C) SCAN / AUTO-MOVE (2 min de farm com P ligado)
   • scans completos ........ 3 ✓ (Slime Verde, Escudeiro de Perim…) — antes: 0
   • metas fora do mapa ..... 0 ✓ (antes: o herói andava contra a borda)
   • cancelamentos .......... só por alvo realmente longe (sem "fuga no meio do scan")
   • Cavernas de Brasas ..... scan completo do "Chamão do Caos" ✓ (print abaixo)
D) TERRENO
   • Bosque (ida) × Bosque (volta) .. soma dos tiles IGUAL ✓ (mapa tem identidade)
   • Bosque × Cavernas ............... soma DIFERENTE ✓ (relevo próprio)
E) REGRESSÃO
   • HUD do mapa ............ "Bosque Verdejante · OverWorld · Mapa 1 da tribo · SAFE ZONE" ✓
   • janelinha (PiP) ........ funções presentes e modo "janela própria" ✓
   • save/recarregar ........ região, scans e nível preservados ✓
   • erros de página ........ nenhum ✓
```

Prints desta rodada: `print_mapa_bosque.png` (o bosque com o HUD novo),
`print_mapa_cavernas.png` (scan concluído nas Cavernas de Brasas) e
`print_mapa_pillar.png` (Túneis do Monte Pillar).

---

## 5. Arquivos

| Arquivo | O que é |
|---|---|
| `chaotic_idleworld_v123.html` | **o jogo com tudo** (v2.21: mapas separados + scan + terreno próprio) |
| `LEIA-ME-MAPAS-E-SCAN.md` | este guia |
| `LEIA-ME-JANELINHA-PIP.md` | guia da janelinha flutuante / modo fora da aba (v2.20) |
| `LEIA-ME-CORRECAO-NOMES-DE-MAPA.md` | guia dos nomes de mapa (v2.18) |
| `patch_mapas_separados.py` | script que aplica esta mudança (histórico reproduzível) |

### Publicar
Suba o `chaotic_idleworld_v123.html` por cima do antigo no GitHub/Render (o `server.js` busca
esse nome exato) e faça o deploy. **Só o jogo mudou** — o `site/index.html` e o servidor continuam
iguais aos da v2.20. Depois de subir, abra o jogo com Ctrl+F5 (ou aba anônima) para o navegador
não usar a versão antiga do arquivo. O título interno passa a mostrar **v2.21**.

> ℹ️ Se você já tinha jogado antes, o **progresso é preservado** (save no navegador + conta).
> O que muda é o desenho dos mapas a partir de agora — e o fato de cada mapa ter criaturas próprias.
