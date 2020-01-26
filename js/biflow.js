const Biflow = {
  URL: "https://mizar.unive.it",
  path: "/catalogo_biflow/api/public/api",

  updateCounters() {
    this.updateCounter("counter-works", "/works",
      work => work.published);
    this.updateCounter("counter-manuscripts", "/manuscripts");
    this.updateCounter("counter-translators", "/people",
      person => person.translations.length > 0);
    this.updateCounter("counter-copyists", "/people",
      person => person.codices.length > 0);
  },

  async updateCounter(elmName, path, fnc = null) {
    const data = await this.getData(path);

    let count = 0;
    data.forEach(obj => {
      if (!fnc || fnc(obj)) {
        count += 1;
      }
    });

    document.getElementById(elmName).textContent = count;
  },

  async getData(path) {
    return this.getDataWithFullPath(this.path + path);
  },

  async getDataWithFullPath(path) {
    const headers = new Headers();
    headers.append("Accept", "application/json");

    const resp = await fetch(this.URL + path, { headers });
    const json = await resp.json();
    return json;
  },

  removeContent(elm) {
    while (elm.firstChild) elm.firstChild.remove();
  },

  showLoader(elmName) {
    const div = document.createElement('div');
    div.setAttribute("class", "lds-circle");
    div.appendChild(document.createElement('div'));

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    elm.appendChild(div);
  },

  showLoaderInUL(elmName) {
    const div = document.createElement('div');
    div.setAttribute("class", "lds-circle");
    div.appendChild(document.createElement('div'));

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const li = document.createElement("li");
    li.setAttribute("class", "list-group-item list-group-item-action");
    elm.appendChild(li);

    li.appendChild(div);
  },

  async showPeople(elmName, filter) {
    this.showLoader(elmName);

    const data = await this.getData("/people");

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const ul = document.createElement("ul");
    elm.appendChild(ul);

    data.forEach(person => this.showPerson(ul, person, filter));
  },

  showPerson(ul, person, filter) {
    if (filter && person.name.toLowerCase().indexOf(filter) === -1) {
      return;
    }

    const li = document.createElement('li');
    ul.appendChild(li);

    const div = document.createElement('div');
    li.appendChild(div);

    div.appendChild(document.createTextNode("Nome: "));

    const anchor = document.createElement('a');
    anchor.href = this.baseurl + "/person?id=" + person.id;
    anchor.appendChild(document.createTextNode(person.name));
    div.appendChild(anchor);

    div.appendChild(document.createElement("br"));
    div.appendChild(document.createTextNode(`
      Numberi: ${person.works.length} schede,
      ${person.translations.length} traduzioni,
      ${person.codices.length} codici`));
  },

  async showManuscripts(elmName, filter) {
    this.showLoader(elmName);

    const data = await this.getData("/manuscripts");

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const ul = document.createElement("ul");
    elm.appendChild(ul);

    data.forEach(manuscript => this.showManuscript(ul, manuscript, filter));
  },

  showManuscript(ul, manuscript, filter) {
    if (filter && manuscript.code.toLowerCase().indexOf(filter) === -1) {
      return;
    }

    const li = document.createElement('li');
    ul.appendChild(li);

    const div = document.createElement('div');
    li.appendChild(div);

    div.appendChild(document.createTextNode("Code: "));

    const anchor = document.createElement('a');
    anchor.href = this.baseurl + "/manuscript?id=" + manuscript.id;
    anchor.appendChild(document.createTextNode(manuscript.shelfMark));
    div.appendChild(anchor);

    div.appendChild(document.createElement("br"));
    div.appendChild(document.createTextNode("N. Versioni: " + manuscript.localisations.length));
  },

  async showWorks(elmName, filter) {
    this.showLoader(elmName);

    const data = await this.getData("/works");

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const ul = document.createElement("ul");
    elm.appendChild(ul);

    data.filter(work => work.published)
        .forEach(work => this.showWork(ul, work, filter));
  },

  showWork(ul, work, filter) {
    if (filter && work.code.toLowerCase().indexOf(filter) === -1) {
      return;
    }

    const li = document.createElement('li');
    ul.appendChild(li);

    const div = document.createElement('div');
    li.appendChild(div);

    div.appendChild(document.createTextNode("Code: "));

    const anchor = document.createElement('a');
    anchor.href = this.baseurl + "/work?id=" + work.id;
    anchor.appendChild(document.createTextNode(work.code));
    div.appendChild(anchor);

    div.appendChild(document.createElement("br"));
    const p = document.createElement('p');
    div.appendChild(p);
    p.innerHTML = work.content;
  },

  async showFullWork(id) {
    // Let's show the loading for any active part of the page.
    ["workCode", "workCodeDownload", "workTitle", "workGenres", "workContent", "workOtherTranslations",
     "workAuthor", "workRelatedWorks", "workEditor"].forEach(elmName => this.showLoader(elmName));
    ["workAttributions", "workExpressions"].forEach(elmName => this.showLoaderInUL(elmName));

    const data = await this.getData("/works/" + id);

    // The simple elements.
    document.getElementById("workMainTitle").textContent = "Scheda opera: " + data.code;
    document.getElementById("workCode").textContent = data.code;
    document.getElementById("workContent").innerHTML = data.content;
    document.getElementById("workOtherTranslations").innerHTML = data.otherTranslations;
    document.getElementById("workRelatedWorks").innerHTML = data.relatedWorks;

    const downloadAnchor = document.getElementById("workCodeDownload");
    downloadAnchor.textContent = data.code;
    downloadAnchor.title = data.code;

    // The complex ones.
    this.showWorkAuthor(data);
    this.showWorkAttributions(data);
    this.showWorkGenres(data);
    this.showWorkEditor(data);
    this.showExpressions(data.expressions, "workExpressions", expressions => {
      const topLevelExpressions = [];
      expressions.forEach(expression => {
        if (expression.derivedFromExpressions.length === 0) {
          topLevelExpressions.push(expression);
        }
      });

      document.getElementById("workTitle").textContent = topLevelExpressions.map(e => e.title).join(", ");

      const workDiagram = document.getElementById("workDiagram");

      // Diagram.
      topLevelExpressions.forEach(expression => {
        const ul = document.createElement("ul");
        ul.setAttribute("class", "list-espressione");
        workDiagram.appendChild(ul);

        const li = document.createElement("li");
        li.textContent = expression.title;
        ul.appendChild(li);

        // This function creates a list of derived expressions.
        function appendDerivedExpressionOf(li, expression) {
          // Let's create a list of the derived expression.
          const list = [];
          expressions.forEach(e => {
            // This expression is the top-level. Ignore it.
            if (e.derivedFromExpressions.length === 0) {
              return;
            }

            // TODO What about if we have more than 1?
            const id = parseInt(e.derivedFromExpressions[0].substr(e.derivedFromExpressions[0].lastIndexOf("/") + 1), 10);

            // This expression doesn't belong to our expression. Ignore it.
            if (id != expression.id) {
              return;
            }

            list.push(e);
          });

          // No derived expressions.
          if (list.length === 0) {
            return;
          }

          const ul = document.createElement("ul");
          li.appendChild(ul);

          // For each derived expression, let's create a "li" element and run recursively.
          list.forEach(e => {
            const subLi = document.createElement("li");
            ul.appendChild(subLi);

            const anchor = document.createElement("a");
            anchor.href = Biflow.baseurl + "/expression?id=" + e.id;
            anchor.textContent = e.title;
            subLi.appendChild(anchor);

            // Recursively...
            appendDerivedExpressionOf(subLi, e);
          });
        }

        appendDerivedExpressionOf(li, expression);
      });
    });
  },

  async showExpressions(list, elmName, cb = null) {
    const expressions = [];

    for (let i = 0; i < list.length; ++i) {
      const expression = await this.getDataWithFullPath(list[i]);
      expressions.push(expression);
    }

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const ul = document.createElement("ul");
    ul.setAttribute("class", "list-group list-group-flush");
    elm.appendChild(ul);

    expressions.forEach(expression => {
      const li = document.createElement("li");
      li.setAttribute("class", "list-group-item list-group-item-action");
      ul.appendChild(li);

      const div = document.createElement('div');
      li.appendChild(div);

      div.appendChild(document.createTextNode("Code: "));

      const anchor = document.createElement('a');
      anchor.href = this.baseurl + "/expression?id=" + expression.id;
      anchor.appendChild(document.createTextNode(expression.code));
      div.appendChild(anchor);

      div.appendChild(document.createElement("br"));
      div.appendChild(document.createTextNode("Titolo: "));
      div.appendChild(document.createTextNode(expression.title));
    });

    if (cb) {
      cb(expressions);
    }
  },

  async showWorkEditor(data) {
    const editor = await this.getDataWithFullPath(data.editor);
    const elm = document.getElementById("workEditor");
    elm.textContent = editor.editor;
  },

  async showWorkAuthor(data) {
    const author = await this.getDataWithFullPath(data.author);

    const a = document.createElement("a");
    a.textContent = author.name;
    a.href = this.baseurl + "/person?id=" + author.id;

    const elm = document.getElementById("workAuthor");
    this.removeContent(elm);
    elm.appendChild(a);
  },

  async showWorkGenres(data) {
    const genres = [];
    for (let i = 0; i < data.genres.length; ++i) {
      // This is the genre.
      const genreData = await this.getDataWithFullPath(data.genres[i]);
      genres.push(genreData.genre);
    }
    document.getElementById("workGenres").textContent = genres.join(", ");
  },

  async showWorkAttributions(data) {
    const attributions = [];
    for (let i = 0; i < data.attributions.length; ++i) {
      // This is the work-attribution.
      const workAttributionData = await this.getDataWithFullPath(data.attributions[i]);
      // This is the attribution.
      const attributionData = await this.getDataWithFullPath(workAttributionData.attribution);
      attributions.push(attributionData.attribution);
    }

    const elm = document.getElementById("workAttributions");
    this.removeContent(elm);

    const ul = document.createElement("ul");
    ul.setAttribute("class", "list-group list-group-flush");
    elm.appendChild(ul);

    attributions.forEach(attribution => {
      const li = document.createElement("li");
      li.setAttribute("class", "list-group-item list-group-item-action");
      ul.appendChild(li);

      const div = document.createElement('div');
      li.appendChild(div);

      const anchor = document.createElement('a');
      anchor.href = this.baseurl + "/person?id=" + attribution.id;
      anchor.appendChild(document.createTextNode(attribution.name));
      div.appendChild(anchor);
    });
  },

  async showFullManuscript(id) {
    // Let's show the loading for any active part of the page.
    ["manuscriptShelfMark", "manuscriptCheckStatus", "manuscriptDate",
     "manuscriptHeight", "manuscriptWidth", "manuscriptLibrary",
     "manuscriptMaterial", "manuscriptCollationDescription",
     "manuscriptBinding", "manuscriptDecoDescription",
     "manuscriptHistory",  "manuscriptNote", "manuscriptPlace",
     "manuscriptPhysDescription", "manuscriptScriptDescription",
     "manuscriptRuledLines", "manuscriptRuledLineTechnique",
     "manuscriptEditor", ]
      .forEach(elmName => this.showLoader(elmName));
    ["manuscriptLocalisations", ].forEach(elmName => this.showLoaderInUL(elmName));

    const data = await this.getData("/manuscripts/" + id);

    // The simple elements.
    document.getElementById("manuscriptMainTitle").textContent = "Manoscritto: " + data.shelfMark;
    document.getElementById("manuscriptDate").textContent = data.date;
    document.getElementById("manuscriptShelfMark").textContent = data.shelfMark;
    document.getElementById("manuscriptHeight").textContent = data.height;
    document.getElementById("manuscriptWidth").textContent = data.width;
    document.getElementById("manuscriptCollationDescription").innerHTML = data.collationDescription;
    document.getElementById("manuscriptBinding").innerHTML = data.binding;
    document.getElementById("manuscriptPhysDescription").innerHTML = data.physDescription;
    document.getElementById("manuscriptDecoDescription").innerHTML = data.decoDescription;
    document.getElementById("manuscriptScriptDescription").innerHTML = data.scriptDescription;
    document.getElementById("manuscriptHistory").innerHTML = data.history;
    document.getElementById("manuscriptNote").innerHTML = data.note;
    document.getElementById("manuscriptContent").innerHTML = data.content;
    document.getElementById("manuscriptPlace").innerHTML = data.place;
    document.getElementById("manuscriptRuledLines").innerHTML = data.place;

    this.showManuscriptCheckStatus(data);
    this.showManuscriptLibrary(data);
    this.showManuscriptMaterial(data);
    this.showManuscriptRuledLineTechnique(data);
    this.showLocalisations(data.localisations, "manuscriptLocalisations");
    this.showManuscriptEditor(data);
  },

  async showManuscriptCheckStatus(data) {
    const checkStatus = await this.getDataWithFullPath(data.checkStatus);
    document.getElementById("manuscriptCheckStatus").textContent = checkStatus.checkStatus;
  },

  async showManuscriptLibrary(data) {
    const library = await this.getDataWithFullPath(data.library);
    document.getElementById("manuscriptLibrary").textContent = `
      Città: ${library.city} -
      Nome: ${library.libraryName} -
      Codice: ${library.libraryCode}
    `;
  },

  async showManuscriptMaterial(data) {
    const material = await this.getDataWithFullPath(data.material);
    document.getElementById("manuscriptMaterial").textContent = material.material;
  },

  async showManuscriptRuledLineTechnique(data) {
    const elm = document.getElementById("manuscriptRuledLineTechnique");
    if (!data.ruledLineTecnique) {
      this.removeContent(elm);
      return;
    }

    const ruledLineTechnique = await this.getDataWithFullPath(data.ruledLineTechnique);
    elm.textContent = ruledLineTechnique.ruledLineTechnique;
  },

  async showManuscriptEditor(data) {
    const elm = document.getElementById("manuscriptEditor");

    if (!data.editor) {
      this.removeContent(elm);
      return;
    }

    const editor = await this.getDataWithFullPath(data.editor);
    elm.textContent = editor.editor;
  },

  async showFullPerson(id) {
    // Let's show the loading for any active part of the page.
    ["personName", "personNicknames", "personBirthDate", "personDeathDate" ]
      .forEach(elmName => this.showLoader(elmName));
    ["personWorks", "personTranslations", "personCodices"].forEach(elmName => this.showLoaderInUL(elmName));

    const data = await this.getData("/people/" + id);

    // The simple elements.
    document.getElementById("personMainTitle").textContent = "Scheda persona: " + data.name;
    document.getElementById("personName").textContent = data.name;
    document.getElementById("personBirthDate").textContent = data.dateBirth;
    document.getElementById("personDeathDate").textContent = data.dateDeath;

    this.showPersonNicknames(data);
    this.showPersonWorks(data);
    this.showExpressions(data.translations, "personTranslations");
    this.showLocalisations(data.codices, "personCodices");
  },

  async showLocalisations(data, elmName) {
    const localisations = [];
    for (let i = 0; i < data.length; ++i) {
      const localisationData = await this.getDataWithFullPath(data[i]);
      if (localisationData.manuscript) {
        localisationData.manuscript = await this.getDataWithFullPath(localisationData.manuscript);
      }

      if (localisationData.expression) {
        localisationData.expression = await this.getDataWithFullPath(localisationData.expression);
      }

      if (localisationData.copyist) {
        localisationData.copyist = await this.getDataWithFullPath(localisationData.copyist);
      }

      localisations.push(localisationData);
    }

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const ul = document.createElement("ul");
    ul.setAttribute("class", "list-group list-group-flush");
    elm.appendChild(ul);

    localisations.forEach(localisation => {
      const li = document.createElement("li");
      li.setAttribute("class", "list-group-item list-group-item-action");
      ul.appendChild(li);

      const div = document.createElement('div');
      li.appendChild(div);

      div.appendChild(document.createTextNode("Localizzazione: "));
      div.appendChild(document.createTextNode(localisation.localisation));
      div.appendChild(document.createElement("br"));

      if (localisation.manuscript) {
        div.appendChild(document.createTextNode("Manoscritto: "));
        let anchor = document.createElement('a');
        anchor.href = this.baseurl + "/manuscript?id=" + localisation.manuscript.id;
        anchor.appendChild(document.createTextNode(localisation.manuscript.shelfMark));
        div.appendChild(anchor);
        div.appendChild(document.createElement("br"));
      }

      if (localisation.expression) {
        div.appendChild(document.createTextNode("Expressione: "));
        let anchor = document.createElement('a');
        anchor.href = this.baseurl + "/expression?id=" + localisation.expression.id;
        anchor.appendChild(document.createTextNode(localisation.expression.title));
        div.appendChild(anchor);
        div.appendChild(document.createElement("br"));
      }

      if (localisation.copyist) {
        div.appendChild(document.createTextNode("Copista: "));
        let anchor = document.createElement('a');
        anchor.href = this.baseurl + "/person?id=" + localisation.copyist.id;
        anchor.appendChild(document.createTextNode(localisation.copyist.name));
        div.appendChild(anchor);
        div.appendChild(document.createElement("br"));
      }

      div.appendChild(document.createTextNode("Data: "));
      div.appendChild(document.createTextNode(localisation.date));
    });
  },
  async showPersonNicknames(data) {
    const nicknames = [];
    for (let i = 0; i < data.nicknames.length; ++i) {
      const nicknameData = await this.getDataWithFullPath(data.nicknames[i]);
      nicknames.push(nicknameData.nickname);
    }
    document.getElementById("personNicknames").textContent = nicknames.join(", ");
  },

  async showPersonWorks(data) {
    const works = [];
    for (let i = 0; i < data.works.length; ++i) {
      works.push(await this.getDataWithFullPath(data.works[i]));
    }

    const elm = document.getElementById("personWorks");
    this.removeContent(elm);

    const ul = document.createElement("ul");
    ul.setAttribute("class", "list-group list-group-flush");
    elm.appendChild(ul);

    works.forEach(work => {
      const li = document.createElement("li");
      li.setAttribute("class", "list-group-item list-group-item-action");
      ul.appendChild(li);

      const div = document.createElement('div');
      li.appendChild(div);

      div.appendChild(document.createTextNode("Code: "));

      const anchor = document.createElement('a');
      anchor.href = this.baseurl + "/work?id=" + work.id;
      anchor.appendChild(document.createTextNode(work.code));
      div.appendChild(anchor);
    });
  },

  async showFullExpression(id) {
    // Let's show the loading for any active part of the page.
    [ "expressionCode", "expressionDate", "expressionLanguage",
      "expressionTitle", "expressionEditionHistory",
      "expressionIncipit", "expressionExplicit", "expressionManuscriptTradition",
      "expressionTextualHistory", "expressionWork",
      "expressionTranslator", "expressionDerivedFrom",
      "expressionTextualTypology",
     ]
      .forEach(elmName => this.showLoader(elmName));
    [ "expressionDerivedExpressions", "expressionLocalisations", ].forEach(elmName => this.showLoaderInUL(elmName));

    const data = await this.getData("/expressions/" + id);

    // The simple elements.
    document.getElementById("expressionMainTitle").textContent = "Versione: " + data.code;
    document.getElementById("expressionCode").textContent = data.code;
    document.getElementById("expressionDate").textContent = data.date;
    document.getElementById("expressionTitle").textContent = data.title;
    document.getElementById("expressionEditionHistory").innerHTML = data.editionHistory;
    document.getElementById("expressionIncipit").innerHTML = data.incipit;
    document.getElementById("expressionExplicit").innerHTML = data.explicit;
    document.getElementById("expressionManuscriptTradition").innerHTML = data.manuscriptTradition;
    document.getElementById("expressionTextualHistory").innerHTML = data.textualHistory;

    // The complex ones.
    this.showExpressionLanguage(data);
    this.showExpressionWork(data);
    this.showExpressionTranslator(data);
    this.showExpressionTextualTypology(data);
    this.showExpressionDerivedFrom(data);
    this.showExpressions(data.derivedExpressions, "expressionDerivedExpressions");
    this.showLocalisations(data.localisations, "expressionLocalisations");
  },

  async showExpressionLanguage(data) {
    const language = await this.getDataWithFullPath(data.language);
    document.getElementById("expressionLanguage").textContent = language.language;
  },

  async showExpressionWork(data) {
    const work = await this.getDataWithFullPath(data.work);

    const anchor = document.createElement('a');
    anchor.href = this.baseurl + "/work?id=" + work.id;
    anchor.appendChild(document.createTextNode(work.code));

    const elm = document.getElementById("expressionWork");
    this.removeContent(elm);
    elm.appendChild(anchor);
  },

  async showExpressionTranslator(data) {
    const elm = document.getElementById("expressionTranslator");

    if (!data.translator) {
      this.removeContent(elm);
      return;
    }

    const person = await this.getDataWithFullPath(data.translator);

    const anchor = document.createElement('a');
    anchor.href = this.baseurl + "/person?id=" + person.id;
    anchor.appendChild(document.createTextNode(person.name));

    this.removeContent(elm);
    elm.appendChild(anchor);
  },

  async showExpressionDerivedFrom(data) {
    const elm = document.getElementById("expressionDerivedFrom");

    if (data.derivedFromExpressions.length === 0) {
      this.removeContent(elm);
      return;
    }

    const anchors = [];

    for (let i = 0; i < data.derivedFromExpressions.length; ++i) {
      const expression = await this.getDataWithFullPath(data.derivedFromExpressions);

      const anchor = document.createElement('a');
      anchor.href = this.baseurl + "/expression?id=" + expression.id;
      anchor.appendChild(document.createTextNode(expression.code));
      anchors.push(anchor);
    }

    this.removeContent(elm);
    anchors.forEach(anchor => elm.appendChild(anchor));
  },

  async showExpressionTextualTypology(data) {
    const elm = document.getElementById("expressionTextualTypology");

    if (!data.textualTypology) {
      this.removeContent(elm);
      return;
    }

    const textualTypology = await this.getDataWithFullPath(data.textualTypology);
    elm.textContent = textualTypology.textualTypology;
  },

  async search(search) {
    this.showLoader("resultsContainer");

    const jsonLD = await fetch(this.URL + this.path + "/docs.jsonld").then(r => r.json());

    const jsonLDWork = jsonLD["hydra:supportedClass"].find(o => o["@id"] === "#Work");
    const jsonLDPerson = jsonLD["hydra:supportedClass"].find(o => o["@id"] === "#Person");
    const jsonLDManuscript = jsonLD["hydra:supportedClass"].find(o => o["@id"] === "#Manuscript");

    search = search.toLowerCase();

    const works = await this.searchJsonLD(jsonLDWork, "/works", search, work => {
      const li = document.createElement("li");
      li.appendChild(document.createTextNode("Scheda: "));

      const anchor = document.createElement('a');
      anchor.href = this.baseurl + "/work?id=" + work.id;
      anchor.appendChild(document.createTextNode(work.code));
      li.appendChild(anchor);

      return li;
    });

    const people = await this.searchJsonLD(jsonLDPerson, "/people", search, person => {
      const li = document.createElement("li");
      li.appendChild(document.createTextNode("Persona: "));

      const anchor = document.createElement('a');
      anchor.href = this.baseurl + "/person?id=" + person.id;
      anchor.appendChild(document.createTextNode(person.name));
      li.appendChild(anchor);
      return li;
    });

    const manuscripts = await this.searchJsonLD(jsonLDManuscript, "/manuscripts", search, manuscript => {
      const li = document.createElement("li");
      li.appendChild(document.createTextNode("Manoscritto: "));

      const anchor = document.createElement('a');
      anchor.href = this.baseurl + "/manuscript?id=" + manuscript.id;
      anchor.appendChild(document.createTextNode(manuscript.shelfMark));
      li.appendChild(anchor);
      return li;
    });

    document.getElementById("searchMainTitle").textContent = "Risultati: " + (works.length + people.length + manuscripts.length);

    const elm = document.getElementById("resultsContainer");
    this.removeContent(elm);

    const ul = document.createElement("ul");
    elm.appendChild(ul);

    works.forEach(work => ul.appendChild(work));
    people.forEach(person => ul.appendChild(person));
    manuscripts.forEach(manuscript => ul.appendChild(manuscript));
  },

  async searchJsonLD(obj, path, search, cb) {
    if (!search) {
      return [];
    }

    const array = await this.getData(path);
    const selectedObjs = [];

    obj["hydra:supportedProperty"].forEach(property => {
      property = property["hydra:property"];
      if (property["range"].startsWith("#")) {
        return;
      }

      const label = property["rdfs:label"];
      array.forEach(obj => {
        if (obj[label] && ("" + obj[label]).toLowerCase().indexOf(search) != -1 &&
            !selectedObjs.includes(obj)) {
          selectedObjs.push(obj);
        }
      });
    });

    const results = [];
    selectedObjs.forEach(obj => {
      results.push(cb(obj));
    });

    return results;
  },
};
