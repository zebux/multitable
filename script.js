/* ==========================================================================
   Multi Tables — logique de l'application
   JavaScript ES6 natif, sans dépendance. Deux vues sont gérées dans index.html :
   configuration puis exercices/correction.
   ========================================================================== */

(() => {
  "use strict";

  /* ------------------------------------------------------------------------
     Constantes
     ------------------------------------------------------------------------ */

  const FIRST_TABLE = 1;
  const LAST_BASIC_TABLE = 10;
  const LAST_ADVANCED_TABLE = 20;
  const MAX_MULTIPLIER = 10;
  const MIN_OPERATIONS = 10;
  const MAX_OPERATIONS = 200;
  const DEFAULT_OPERATION_COUNT = 20;
  const MAX_GENERATION_ATTEMPTS = 12;

  /* ------------------------------------------------------------------------
     Références du DOM
     ------------------------------------------------------------------------ */

  const configView = document.getElementById("config-view");
  const exerciseView = document.getElementById("exercise-view");
  const viewSubtitle = document.getElementById("view-subtitle");

  const configForm = document.getElementById("config-form");
  const basicTables = document.getElementById("basic-tables");
  const advancedTables = document.getElementById("advanced-tables");
  const advancedToggle = document.getElementById("toggle-advanced");
  const selectAllButton = document.getElementById("select-all");
  const clearAllButton = document.getElementById("clear-all");
  const selectionCount = document.getElementById("selection-count");
  const operationCountInput = document.getElementById("operation-count");
  const configError = document.getElementById("config-error");
  const generateButton = document.getElementById("generate-button");

  const seriesSummary = document.getElementById("series-summary");
  const exerciseProgress = document.getElementById("exercise-progress");
  const exerciseList = document.getElementById("exercise-list");
  const restartButton = document.getElementById("restart-button");
  const backButton = document.getElementById("back-button");
  const resetButton = document.getElementById("reset-button");
  const checkButton = document.getElementById("check-button");
  const correctionHint = document.getElementById("correction-hint");

  const scorePanel = document.getElementById("score-panel");
  const scoreTitle = document.getElementById("score-title");
  const scoreMessage = document.getElementById("score-message");
  const scoreTotal = document.getElementById("score-total");
  const scoreCorrect = document.getElementById("score-correct");
  const scoreErrors = document.getElementById("score-errors");
  const scorePercent = document.getElementById("score-percent");
  const congrats = document.getElementById("congrats");

  const DEFAULT_HINT =
    "Répondez à tous les exercices, puis cliquez sur Corriger. Vous pourrez " +
    "modifier vos réponses après la première correction.";

  /* ------------------------------------------------------------------------
     État de l'application
     settings : paramètres de la série en cours
     operations : opérations générées (paires ordonnées uniques)
     signature : identifiant de la série, utilisé par Recommencer
     stage : answering | checked | corrected
     ------------------------------------------------------------------------ */

  const state = {
    settings: null,
    operations: [],
    signature: null,
    stage: "answering",
  };

  /* ------------------------------------------------------------------------
     Petits utilitaires
     ------------------------------------------------------------------------ */

  /**
   * Retourne "s" uniquement si le nombre est supérieur à un.
   * @param {number} count
   * @returns {string}
   */
  function pluralSuffix(count) {
    return count > 1 ? "s" : "";
  }

  /**
   * Remonte la page en douceur, sauf si l'utilisateur préfère réduire les animations.
   */
  function scrollToTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  /**
   * Récupère toutes les cases de tables, y compris celles masquées.
   * @returns {HTMLInputElement[]}
   */
  function getAllTableCheckboxes() {
    return Array.from(document.querySelectorAll('input[name="tables"]'));
  }

  /* ------------------------------------------------------------------------
     Configuration : cases à cocher et validation
     ------------------------------------------------------------------------ */

  /**
   * Crée une case à cocher de table avec un label explicite.
   * @param {number} tableNumber
   * @param {boolean} checked
   * @returns {HTMLLabelElement}
   */
  function createTableCheckbox(tableNumber, checked) {
    const label = document.createElement("label");
    label.className = "table-choice";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "tables";
    input.value = String(tableNumber);
    input.checked = checked;

    const text = document.createElement("span");
    text.textContent = `Table de ${tableNumber}`;

    label.append(input, text);
    return label;
  }

  /**
   * Construit les 20 cases de tables : 1-10 visibles, 11-20 masquées.
   */
  function buildTableCheckboxes() {
    const basicFragment = document.createDocumentFragment();
    const advancedFragment = document.createDocumentFragment();

    for (let table = FIRST_TABLE; table <= LAST_ADVANCED_TABLE; table += 1) {
      const isBasic = table <= LAST_BASIC_TABLE;
      const checkbox = createTableCheckbox(table, isBasic);
      (isBasic ? basicFragment : advancedFragment).append(checkbox);
    }

    basicTables.append(basicFragment);
    advancedTables.append(advancedFragment);
  }

  /**
   * Met à jour le compteur de tables sélectionnées (toutes confondues).
   */
  function updateSelectionCount() {
    const selectedCount = getAllTableCheckboxes().filter((input) => input.checked).length;
    selectionCount.textContent =
      `${selectedCount} table${pluralSuffix(selectedCount)} ` +
      `sélectionnée${pluralSuffix(selectedCount)}`;
  }

  /**
   * Affiche ou masque les tables avancées (11 à 20).
   */
  function toggleAdvancedTables() {
    const shouldShow = advancedTables.hidden;
    advancedTables.hidden = !shouldShow;
    advancedToggle.setAttribute("aria-expanded", String(shouldShow));
    advancedToggle.textContent = shouldShow
      ? "Masquer les tables avancées"
      : "Afficher les tables avancées";
  }

  /**
   * Coche ou décoche toutes les tables, y compris les tables avancées masquées.
   * @param {boolean} checked
   */
  function setAllTablesChecked(checked) {
    getAllTableCheckboxes().forEach((input) => {
      input.checked = checked;
    });
    updateSelectionCount();
    clearConfigError();
  }

  /**
   * Efface le message d'erreur de configuration.
   */
  function clearConfigError() {
    configError.hidden = true;
    configError.textContent = "";
  }

  /**
   * Affiche un message d'erreur et place le focus sur le champ concerné.
   * @param {string} message
   * @param {HTMLElement} focusTarget
   */
  function showConfigError(message, focusTarget) {
    configError.textContent = message;
    configError.hidden = false;
    focusTarget.focus();
  }

  /**
   * Lit les paramètres saisis dans le formulaire.
   * @returns {{tables: number[], count: number}}
   */
  function readSettings() {
    const tables = getAllTableCheckboxes()
      .filter((input) => input.checked)
      .map((input) => Number(input.value))
      .sort((a, b) => a - b);

    return {
      tables,
      count: Number(operationCountInput.value),
    };
  }

  /**
   * Vérifie les paramètres et renvoie un message d'erreur le cas échéant.
   * @param {{tables: number[], count: number}} settings
   * @returns {string|null}
   */
  function validateSettings(settings) {
    if (settings.tables.length === 0) {
      return "Sélectionnez au moins une table avant de générer les exercices.";
    }

    const isInteger = Number.isInteger(settings.count);
    if (
      !isInteger ||
      settings.count < MIN_OPERATIONS ||
      settings.count > MAX_OPERATIONS
    ) {
      return `Le nombre d'opérations doit être compris entre ${MIN_OPERATIONS} et ${MAX_OPERATIONS}.`;
    }

    const possibleCount = settings.tables.length * MAX_MULTIPLIER;
    if (settings.count > possibleCount) {
      return (
        `Impossible de créer ${settings.count} opérations uniques : seules ` +
        `${possibleCount} combinaisons sont possibles avec les tables ` +
        `sélectionnées. Sélectionnez davantage de tables ou diminuez le ` +
        `nombre d'exercices.`
      );
    }

    return null;
  }

  /* ------------------------------------------------------------------------
     Génération des opérations
     ------------------------------------------------------------------------ */

  /**
   * Construit toutes les paires ordonnées possibles.
   * Ex. : si 2 et 4 sont sélectionnées, 2 × 4 et 4 × 2 sont deux opérations distinctes.
   * @param {number[]} tables
   * @returns {{factor: number, multiplier: number, answer: number}[]}
   */
  function buildOperationPool(tables) {
    const pool = [];

    for (const factor of tables) {
      for (let multiplier = 1; multiplier <= MAX_MULTIPLIER; multiplier += 1) {
        pool.push({
          factor,
          multiplier,
          answer: factor * multiplier,
        });
      }
    }

    return pool;
  }

  /**
   * Mélange un tableau avec l'algorithme de Fisher-Yates.
   * @template T
   * @param {T[]} array
   * @returns {T[]}
   */
  function shuffle(array) {
    for (let index = array.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
    }
    return array;
  }

  /**
   * Crée un identifiant textuel de la série pour éviter de régénérer la même.
   * @param {{factor: number, multiplier: number}[]} operations
   * @returns {string}
   */
  function createSignature(operations) {
    return operations
      .map((operation) => `${operation.factor}x${operation.multiplier}`)
      .join("|");
  }

  /**
   * Génère une série d'opérations uniques, différente de la précédente.
   * @param {{tables: number[], count: number}} settings
   * @param {string|null} previousSignature
   * @returns {{operations: object[], signature: string}}
   */
  function generateOperations(settings, previousSignature) {
    const pool = shuffle(buildOperationPool(settings.tables));
    let operations = pool.slice(0, settings.count);
    let signature = createSignature(operations);

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
      if (signature !== previousSignature) {
        return { operations, signature };
      }
      shuffle(pool);
      operations = pool.slice(0, settings.count);
      signature = createSignature(operations);
    }

    // Dernier recours : une rotation garantit un ordre différent de la série précédente.
    if (pool.length > 1 && signature === previousSignature) {
      pool.push(pool.shift());
      operations = pool.slice(0, settings.count);
      signature = createSignature(operations);
    }

    return { operations, signature };
  }

  /* ------------------------------------------------------------------------
     Affichage des vues
     ------------------------------------------------------------------------ */

  /**
   * Formate la liste des tables pour le résumé de la série.
   * @param {number[]} tables
   * @returns {string}
   */
  function formatTableList(tables) {
    if (tables.length <= 12) {
      return tables.join(", ");
    }
    return `${tables.slice(0, 12).join(", ")} … (${tables.length} tables)`;
  }

  /**
   * Affiche la vue des exercices.
   * @param {{tables: number[], count: number}} settings
   */
  function showExerciseView(settings) {
    configView.hidden = true;
    exerciseView.hidden = false;
    viewSubtitle.textContent = "Répondez, corrigez, recommencez !";
    seriesSummary.textContent =
      `${settings.count} multiplications uniques · ` +
      `Tables : ${formatTableList(settings.tables)}`;
    scrollToTop();
  }

  /**
   * Affiche la vue de configuration.
   */
  function showConfigView() {
    exerciseView.hidden = true;
    configView.hidden = false;
    viewSubtitle.textContent = "Choisissez vos tables et générez une série d'exercices.";
    scrollToTop();
    generateButton.focus();
  }

  /**
   * Réinitialise le formulaire (tables 1-10, 20 exercices) et revient à la configuration.
   * Le bouton "Retour à la configuration" conserve quant à lui les paramètres choisis.
   */
  function resetConfiguration() {
    getAllTableCheckboxes().forEach((input) => {
      input.checked = Number(input.value) <= LAST_BASIC_TABLE;
    });

    advancedTables.hidden = true;
    advancedToggle.setAttribute("aria-expanded", "false");
    advancedToggle.textContent = "Afficher les tables avancées";
    operationCountInput.value = String(DEFAULT_OPERATION_COUNT);

    updateSelectionCount();
    clearConfigError();
    showConfigView();
  }

  /* ------------------------------------------------------------------------
     Exercices et saisie
     ------------------------------------------------------------------------ */

  /**
   * Récupère les champs de réponse dans l'ordre d'affichage.
   * @returns {HTMLInputElement[]}
   */
  function getAnswerInputs() {
    return Array.from(exerciseList.querySelectorAll(".answer-input"));
  }

  /**
   * Affiche le numéro de l'exercice en cours de saisie.
   * @param {number} index
   */
  function updateProgress(index) {
    const total = state.operations.length;
    exerciseProgress.textContent = total
      ? `Exercice ${index + 1} sur ${total}`
      : "";
  }

  /**
   * Crée la carte d'un exercice avec son champ numérique et son retour accessible.
   * @param {{factor: number, multiplier: number}} operation
   * @param {number} index
   * @param {number} total
   * @returns {HTMLElement}
   */
  function createExerciseCard(operation, index, total) {
    const card = document.createElement("article");
    card.className = "exercise-card";
    card.style.setProperty("--delay", `${Math.min(index, 20) * 18}ms`);

    const number = document.createElement("span");
    number.className = "exercise-number";
    number.textContent = String(index + 1);

    const input = document.createElement("input");
    input.type = "number";
    input.id = `answer-${index}`;
    input.className = "answer-input";
    input.min = "0";
    input.step = "1";
    input.pattern = "[0-9]*";
    input.inputMode = "numeric";
    input.enterKeyHint = index === total - 1 ? "done" : "next";
    input.autocomplete = "off";
    input.required = true;

    const expression = document.createElement("span");
    expression.textContent = `${operation.factor} × ${operation.multiplier} =`;

    const label = document.createElement("label");
    label.className = "exercise-question";
    label.htmlFor = input.id;
    label.append(expression, input);

    const feedback = document.createElement("p");
    feedback.className = "exercise-feedback";
    feedback.id = `feedback-${index}`;
    feedback.hidden = true;

    card.append(number, label, feedback);
    return card;
  }

  /**
   * Réinitialise les éléments liés à la correction pour une nouvelle série.
   */
  function resetCorrectionUi() {
    state.stage = "answering";
    scorePanel.hidden = true;
    checkButton.disabled = false;
    checkButton.textContent = "Corriger";
    correctionHint.textContent = DEFAULT_HINT;
    congrats.hidden = true;
  }

  /**
   * Dessine toutes les cartes d'exercices de la série.
   * @param {object[]} operations
   */
  function renderExercises(operations) {
    const fragment = document.createDocumentFragment();

    operations.forEach((operation, index) => {
      fragment.append(createExerciseCard(operation, index, operations.length));
    });

    exerciseList.replaceChildren(fragment);
    resetCorrectionUi();
    updateProgress(0);
  }

  /**
   * Démarre (ou redémarre) une série avec les paramètres donnés.
   * @param {{tables: number[], count: number}} settings
   */
  function startSession(settings) {
    const generated = generateOperations(settings, state.signature);

    state.settings = { tables: [...settings.tables], count: settings.count };
    state.operations = generated.operations;
    state.signature = generated.signature;

    renderExercises(generated.operations);
    showExerciseView(settings);

    const firstInput = getAnswerInputs()[0];
    if (firstInput) {
      firstInput.focus();
    }
  }

  /**
   * Passe au champ suivant avec Entrée ; sur le dernier champ, va au bouton Corriger.
   * @param {KeyboardEvent} event
   */
  function handleEnterKey(event) {
    if (event.key !== "Enter" || !event.target.matches(".answer-input")) {
      return;
    }

    event.preventDefault();
    const inputs = getAnswerInputs();
    const currentIndex = inputs.indexOf(event.target);
    const nextInput = inputs[currentIndex + 1];

    if (nextInput) {
      nextInput.focus();
      nextInput.select();
      updateProgress(currentIndex + 1);
    } else {
      checkButton.focus();
    }
  }

  /* ------------------------------------------------------------------------
     Correction en deux étapes
     ------------------------------------------------------------------------ */

  /**
   * Lit la valeur d'un champ : null signifie une réponse vide (= erreur).
   * @param {HTMLInputElement} input
   * @returns {number|null}
   */
  function readAnswer(input) {
    const value = input.value.trim();
    return value === "" ? null : Number(value);
  }

  /**
   * Compare toutes les réponses aux résultats attendus.
   * @returns {object[]} résultats enrichis
   */
  function evaluateAnswers() {
    const inputs = getAnswerInputs();

    return state.operations.map((operation, index) => {
      const value = readAnswer(inputs[index]);
      return {
        ...operation,
        index,
        value,
        correct: value === operation.answer,
      };
    });
  }

  /**
   * Applique les couleurs de validation sans révéler les bonnes réponses.
   * @param {object[]} results
   */
  function applyResultStyles(results) {
    const inputs = getAnswerInputs();

    results.forEach((result, index) => {
      const input = inputs[index];
      const card = input.closest(".exercise-card");

      input.classList.toggle("is-correct", result.correct);
      input.classList.toggle("is-wrong", !result.correct);
      input.setAttribute("aria-invalid", String(!result.correct));

      // Après la première correction, seules les réponses fausses restent modifiables.
      input.readOnly =
        state.stage === "corrected" || (state.stage === "checked" && result.correct);

      if (card) {
        card.dataset.state = result.correct ? "correct" : "wrong";
      }
    });
  }

  /**
   * Met à jour le panneau de score (provisoire puis définitif).
   * @param {object[]} results
   */
  function updateScore(results) {
    const total = results.length;
    const correctCount = results.filter((result) => result.correct).length;
    const errorCount = total - correctCount;
    const percentage = total ? Math.round((correctCount / total) * 100) : 0;
    const isFinal = state.stage === "corrected";

    scoreTitle.textContent = isFinal ? "Bilan final" : "Résultat provisoire";
    scoreMessage.textContent = isFinal
      ? "Correction complète affichée."
      : "Les bonnes réponses ne sont pas encore affichées.";
    scoreTotal.textContent = String(total);
    scoreCorrect.textContent = String(correctCount);
    scoreErrors.textContent = String(errorCount);
    scorePercent.textContent = `${percentage} %`;
    congrats.hidden = !(isFinal && percentage === 100);
    scorePanel.hidden = false;
  }

  /**
   * Affiche la correction complète : mauvaise réponse barrée puis bonne réponse en rouge.
   * @param {object[]} results
   */
  function renderCorrections(results) {
    const inputs = getAnswerInputs();

    results.forEach((result, index) => {
      const feedback = document.getElementById(`feedback-${index}`);
      feedback.replaceChildren();
      feedback.hidden = false;
      feedback.classList.toggle("is-correct", result.correct);
      feedback.classList.toggle("is-wrong", !result.correct);

      if (result.correct) {
        feedback.textContent = `Bonne réponse : ${result.answer}.`;
      } else {
        const displayedAnswer = result.value === null ? "(vide)" : String(result.value);

        feedback.append(
          document.createTextNode(`${result.factor} × ${result.multiplier} = `)
        );

        const wrongAnswer = document.createElement("s");
        wrongAnswer.textContent = displayedAnswer;

        const goodAnswer = document.createElement("strong");
        goodAnswer.className = "correct-answer";
        goodAnswer.textContent = String(result.answer);

        feedback.append(wrongAnswer, document.createTextNode(" → "), goodAnswer);
      }

      inputs[index].setAttribute("aria-describedby", feedback.id);
    });
  }

  /**
   * Gère les deux clics successifs du bouton Corriger.
   */
  function handleCheck() {
    const results = evaluateAnswers();

    if (state.stage === "answering") {
      state.stage = "checked";
      applyResultStyles(results);
      updateScore(results);
      checkButton.textContent = "Afficher la correction";
      correctionHint.textContent =
        "Vous pouvez modifier les réponses rouges. Cliquez une seconde fois " +
        "pour afficher la correction complète.";
      return;
    }

    if (state.stage === "checked") {
      state.stage = "corrected";
      applyResultStyles(results);
      updateScore(results);
      renderCorrections(results);
      checkButton.textContent = "Correction affichée";
      checkButton.disabled = true;
      correctionHint.textContent =
        "Correction affichée. Utilisez Recommencer pour obtenir une nouvelle série.";
    }
  }

  /**
   * Après la première correction, recalcule couleurs et score quand l'enfant modifie
   * une réponse incorrecte, sans jamais afficher les solutions.
   * @param {Event} event
   */
  function handleAnswerInput(event) {
    if (state.stage !== "checked" || !event.target.matches(".answer-input")) {
      return;
    }

    const results = evaluateAnswers();
    applyResultStyles(results);
    updateScore(results);
  }

  /* ------------------------------------------------------------------------
     Initialisation des écouteurs
     ------------------------------------------------------------------------ */

  function init() {
    buildTableCheckboxes();
    updateSelectionCount();

    advancedToggle.addEventListener("click", toggleAdvancedTables);
    selectAllButton.addEventListener("click", () => setAllTablesChecked(true));
    clearAllButton.addEventListener("click", () => setAllTablesChecked(false));
    configForm.addEventListener("input", clearConfigError);
    configForm.addEventListener("change", clearConfigError);

    configForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearConfigError();

      const settings = readSettings();
      const error = validateSettings(settings);

      if (error) {
        const focusTarget =
          settings.tables.length === 0
            ? document.querySelector('input[name="tables"]')
            : operationCountInput;
        showConfigError(error, focusTarget);
        return;
      }

      startSession(settings);
    });

    exerciseList.addEventListener("keydown", handleEnterKey);
    exerciseList.addEventListener("input", handleAnswerInput);
    exerciseList.addEventListener("focusin", (event) => {
      if (!event.target.matches(".answer-input")) {
        return;
      }
      const index = getAnswerInputs().indexOf(event.target);
      updateProgress(index);
    });

    checkButton.addEventListener("click", handleCheck);
    restartButton.addEventListener("click", () => {
      if (state.settings) {
        startSession(state.settings);
      }
    });
    backButton.addEventListener("click", showConfigView);
    resetButton.addEventListener("click", resetConfiguration);
  }

  init();
})();
