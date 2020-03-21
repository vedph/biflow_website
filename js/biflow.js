const SearchSettings = {
  // ~50 years.
  dateDelta: 50,

  filterWork(work, filter) {
    return this.filterGeneric(work, filter, [
      { field: 'code', priority: 1, name: null, },
      { field: 'content', priority: 2, name: 'Contenuto', },
      { field: 'relatedWorks', priority: 2, name: 'Lavori collegati', },
    ]);
  },

  filterExpression(expression, filter) {
    return this.filterGeneric(expression, filter, [
      { field: 'code', priority: 1, name: null, },
      { field: 'title', priority: 2, name: 'Titolo', },
      { field: 'incipit', priority: 3, name: 'Incipit', },
      { field: 'explicit', priority: 3, name: 'Explicit', },
      { field: 'textualHistory', priority: 3, name: 'Storia testuale', },
      { field: 'date', priority: 2, name: 'Date',
        cb: this.dateFilter, },
      { field: 'editionHistory', priority: 3, name: 'Storia dell\'edizione', },
      { field: 'manuscriptTradition', priority: 3, name: 'Tradizione del manoscritto', },
    ]);
  },

  filterPerson(person, filter) {
    return this.filterGeneric(person, filter, [
      { field: 'name', priority: 1, name: null, },
      { field: 'dateBirth', priority: 2, name: "Data di nascita",
        cb: this.dateFilter, },
      { field: 'dateDeath', priority: 2, name: "Data di morte",
        cb: this.dateFilter, },
    ]);
  },

  filterManuscript(manuscript, filter) {
    return this.filterGeneric(manuscript, filter, [
      { field: 'shelfMark', priority: 1, name: null, },
      { field: 'date', priority: 2, name: "Data",
        cb: this.dateFilter, },
    ]);
  },

  filterGeneric(what, filter, fields) {
    let priorities = [];

    fields.forEach(field => {
      if (field.cb) {
        if (!field.cb(what[field.field], filter)) {
          return;
        }
      } else if (what[field.field].toLowerCase().indexOf(filter) === -1) {
        return;
      }

      let result = {
        priority: field.priority,
      };

      if (field.name) {
        result.fieldName = field.name;
        result.fieldValue = what[field.field];
      }

      priorities.push(result);
    });

    return priorities;
  },

  dateFilter(date, filter) {
    if (date === "") {
      return false;
    }

    filter = filter.trim();
    let year = null;
    let month = null;
    let day = null;

    if (/^\d\d\d\d$/.exec(filter) !== null) {
      year = parseInt(filter, 10);
    } else if (/^\d\d-\d\d\d\d$/.exec(filter) !== null) {
      const parts = filter.split("-");
      month = parseInt(parts[0], 10);
      year = parseInt(parts[1], 10);
    } else if (/^\d\d-\d\d-\d\d\d\d$/.exec(filter) !== null) {
      const parts = filter.split("-");
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else {
      return false;
    }

    if (date[0] === '>') {
      date = SearchSettings.parseDate(date.substring(1).trim());
      if (!date) {
        console.log("Invalid date in the DB!", date);
        return false;
      }

      if (date.match === '=') {
        return year >= date.year;
      }

      if (date.match === '~') {
        return (year + SearchSettings.dateDelta) >= date.year;
      }

      console.log("Invalid parsing: " + date);
      return false;
    }

    if (date[0] === '<') {
      date = SearchSettings.parseDate(date.substring(1).trim());
      if (!date) {
        console.log("Invalid date in the DB!", date);
        return false;
      }

      if (date.match === '=') {
        return year <= date.year;
      }

      if (date.match === '~') {
        return (year - SearchSettings.dateDelta) <= date.year;
      }

      console.log("Invalid parsing: " + date);
      return false;
    }

    if (!date.includes("<>")) {
      date = SearchSettings.parseDate(date.trim());
      if (!date) {
        console.log("Invalid date in the DB!", date);
        return false;
      }

      if (date.match === '~') {
        return Math.abs(year - date.year) < SearchSettings.dateDelta;
      }

      if (date.year != year) {
        return false;
      }

      if (month && date.month != month) {
        return false;
      }

      if (day && date.day != day) {
        return false;
      }

      return true;
    }

    const parts = date.split("<>").map(a => a.trim());
    const preDate = SearchSettings.parseDate(parts[0]);
    const postDate = SearchSettings.parseDate(parts[1]);

    if (!preDate || !postDate) {
      console.log("Invalid date in the DB!", preDate, postDate);
      return false;
    }

    if (preDate.match === '~') {
      if ((year + SearchSettings.dateDelta) < preDate.year) {
        return false;
      }
    }

    if (preDate.match === '=') {
      if (preDate.year >= year) {
        return false;
      }

      if (preDate.year === year && month && preDate.month >= month) {
        return false;
      }

      if (preDate.year === year && month && preDate.month == month && day && preDate.day >= day) {
        return false;
      }
    }

    if (postDate.match === '~') {
      if ((year - SearchSettings.dateDelta) > postDate.year) {
        return false;
      }
    }

    if (postDate.match === '=') {
      if (postDate.year <= year) {
        return false;
      }

      if (postDate.year === year && month && postDate.month <= month) {
        return false;
      }

      if (postDate.year === year && month && postDate.month == month && day && postDate.day <= day) {
        return false;
      }
    }

    return true;
  },

  parseDate(date) {
    // 1234
    if (/^\d\d\d\d$/.exec(date)) {
      return { match: '=', year: parseInt(date, 10) };
    }

    // ~1234
    if (/^~\s*\d\d\d\d$/.exec(date)) {
      return { match: '~', year: parseInt(date.split("~")[1], 10) };
    }

    // 01-1234
    if (/^\d\d-\d\d\d\d$/.exec(date)) {
      const parts = date.split("-");
      return { match: '=', year: parseInt(parts[1], 10), month: parseInt(parts[0], 10) };
    }

    // 01-01-1234
    if (/^\d\d-\d\d-\d\d\d\d$/.exec(date)) {
      const parts = date.split("-");
      return { match: '=', year: parseInt(parts[2], 10), month: parseInt(parts[1], 10), day: parseInt(parts[0], 10) };
    }

    // Something went wrong into the DB...
    return null;
  }
};

const Biflow = {
  URL: "https://mizar.unive.it",
  path: "/catalogo_biflow/api/public/api",

  itemsPerPage: 10,

  cachedFetchedURLs: new Map(),

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
    // Let's see if we have this path in the cache.
    if (this.cachedFetchedURLs.has(path)) {
      return this.cachedFetchedURLs.get(path);
    }

    const headers = new Headers();
    headers.append("Accept", "application/json");

    const resp = await fetch(this.URL + path, { headers });
    const json = await resp.json();

    // Let's store it in the cache.
    this.cachedFetchedURLs.set(path, json);
    return json;
  },

  removeContent(elm) {
    while (elm.firstChild) elm.firstChild.remove();
  },

  showLoader(elmName) {
    const elm = document.getElementById(elmName);
    this.showLoaderInElement(elm);
  },

  showLoaderInElement(elm) {
    const div = document.createElement('div');
    div.setAttribute("class", "lds-circle");
    div.appendChild(document.createElement('div'));

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

    let data = await this.getData("/people");
    data = data.map(person => {
      let results = [];
      if (filter) {
        results = SearchSettings.filterPerson(person, filter);
      }

      return { person, results, }
    });

    if (filter) {
      data = data.filter(person => person.results.length !== 0);
    }

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const pageData = this.reducePagination(data);
    pageData.data.forEach(data => this.showPerson(elm, data));
    this.showPagination(pageData);
  },

  showPerson(elm, data) {
    const p = this.blockPerson(data.person, data.results);
    elm.appendChild(p);
  },

  async showManuscripts(elmName, filter) {
    this.showLoader(elmName);

    let libraries = await this.getData("/libraries");

    let data = await this.getData("/manuscripts");
    data = data.map(manuscript => {
      let results = [];
      if (filter) {
        results = SearchSettings.filterManuscript(manuscript, filter);
      }

      return { manuscript, results, }
    });

    if (filter) {
      data = data.filter(manuscript => manuscript.results.length !== 0);
    }

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const pageData = this.reducePagination(data);
    pageData.data.forEach(manuscript => this.showManuscript(elm, manuscript, libraries));
    this.showPagination(pageData);
  },

  showManuscript(elm, manuscript, libraries) {
    const p = this.blockManuscript(manuscript.manuscript, manuscript.results, libraries);
    elm.appendChild(p);
  },

  async showWorks(elmName, filter) {
    this.showLoader(elmName);

    let data = await this.getData("/works");
    data = data.filter(work => work.published);

    data = data.map(work => {
      let results = [];
      if (filter) {
        results = SearchSettings.filterWork(work, filter);
      }

      return { work, results, }
    });

    if (filter) {
      data = data.filter(work => work.results.length !== 0);
    }

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const pageData = this.reducePagination(data);
    pageData.data.forEach(work => this.showWork(elm, work));
    this.showPagination(pageData);
  },

  showWork(elm, work) {
    const b = this.blockWork(work.work, work.results);
    elm.appendChild(b);
  },

  async showFullWork(id) {
    // Let's show the loading for any active part of the page.
    ["workCode", "workCodeDownload", "workTitle", "workGenres", "workContent", "workOtherTranslations",
     "workAuthor", "workRelatedWorks", "workEditor", "workBibliographies", "workQuote"].forEach(elmName => this.showLoader(elmName));
    ["workAttributions", "workExpressions"].forEach(elmName => this.showLoaderInUL(elmName));

    const data = await this.getData("/works/" + id);

    // The simple elements.
    document.getElementById("workMainTitle").textContent = data.code;
    document.getElementById("workCode").textContent = data.code;
    document.getElementById("workContent").innerHTML = data.content;
    document.getElementById("workOtherTranslations").innerHTML = data.otherTranslations;
    document.getElementById("workRelatedWorks").innerHTML = data.relatedWorks;

    const downloadAnchor = document.getElementById("workCodeDownload");
    downloadAnchor.textContent = data.code;
    downloadAnchor.title = data.code;
    downloadAnchor.href = "worktoprint.html?id=" + data.id;

    // The complex ones.
    this.showWorkAuthor(data);
    this.showWorkAttributions(data);
    this.showWorkGenres(data);
    this.showWorkEditor(data);
    this.showWorkBibliographies(data);
    this.showWorkQuote(data);
    this.showExpressions(data.expressions, "workExpressions", expressions => {
      const topLevelExpressions = [];
      expressions.forEach(expression => {
        if (expression.derivedFromExpressions.length === 0) {
          topLevelExpressions.push(expression);
        }
      });

      document.getElementById("workTitle").textContent = this.dedupArray(topLevelExpressions.map(e => e.title)).join(", ");

      // Diagram.
      const dots = [];
      dots.push("graph {");
      dots.push("rankdir=LR;");
      expressions.forEach(e => {
        e.derivedFromExpressions.forEach(de => {
          const id = parseInt(de.substr(de.lastIndexOf("/") +1), 10);
          de = expressions.find(ee => ee.id === id);
          dots.push(`"${de.code}" -- "${e.code}";`);
        });
      });
      dots.push("}");

      const img = document.createElement("img");
      document.getElementById("workDiagram").appendChild(img);
      const url = new URL("https://image-charts.com/chart?chs=700x200&cht=gv");
      url.searchParams.set("chl", dots.join(""));
      img.src = url.href;
    });
  },

// End diagram

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

  async showWorkQuote(data) {
    const quote = [];
    const editor = await this.getDataWithFullPath(data.editor);
    quote.push(editor.editor);
    quote.push("<em>"+data.code+"</em>");
    quote.push("in <em>Toscana Bilingue</em> - Catalogo Biflow, Venezia, ECF,  pubblicato il " + data.creationDate)
    const elm = document.getElementById("workQuote")
    elm.innerHTML = quote.join(", ");
  },

  async showWorkBibliographies(data) {
    const df = new DocumentFragment();
    await this.addBibliographyItems(df, data.bibliographies);
    const elm = document.getElementById("workBibliographies");
    this.removeContent(elm);
    elm.appendChild(df);
  },
  // Bibliographies
  async addBibliographyItems(df, bibliographies) {
    df.appendChild(document.createElement("br"));

    const ul = document.createElement("ul");
    df.appendChild(ul);

    for (let i = 0; i < bibliographies.length; ++i) {
      const bibliography = await Biflow.getDataWithFullPath(bibliographies[i]);

      let value = bibliography.codeBibl + " = " +
                  bibliography.author + ", " +
                  bibliography.title;

      if (bibliography.chapter) {
        value += ", in " + bibliography.chapter;
      }

      if (bibliography.journal) {
        value += ", in " + bibliography.journal + ", " + bibliography.journalNumber;

        if (bibliography.date) {
          value += " (" + bibliography.date + ")";
        }
      }

      if (bibliography.editor) {
        value += ", a cura di " + bibliography.editor;
      }

      if (bibliography.place && bibliography.publisher) {
        value += ", " + bibliography.place + ", " + bibliography.publisher;

        if (bibliography.date) {
          value += " (" + bibliography.date + ")";
        }
      }

      if (bibliography.volume) {
        value += ", " + bibliography.volume;

        if (bibliography.volumeNumber) {
          value += " - " + bibliography.volumeNumber;
        }
      }

      if (bibliography.pageNumber) {
        value += ", " + bibliography.pageNumber;
      }

      if (bibliography.url) {
        value += ", " + bibliography.url;
      }

      const li = document.createElement("li");
      li.textContent = value;
      ul.appendChild(li);
    }
  },
  //end Bibliographies's function

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
      const attributionData = await this.getDataWithFullPath(data.attributions[i]);
      attributions.push(attributionData);
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
    const library = await this.getDataWithFullPath(data.library);


    // The simple elements.
    document.getElementById("manuscriptMainTitle").textContent = library.libraryCode + ", " + data.shelfMark;
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
    const elm = document.getElementById("manuscriptMaterial");

    if (!data.material) {
      this.removeContent(elm);
      return;
    }

    const material = await this.getDataWithFullPath(data.material);
    elm.textContent = material.material;
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
    document.getElementById("personMainTitle").textContent = data.name;
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
        let anchor = document.createElement('a');
        anchor.href = this.baseurl + "/manuscript?id=" + localisation.manuscript.id;
        anchor.appendChild(document.createTextNode(localisation.manuscript.shelfMark));
        div.appendChild(anchor);
        div.appendChild(document.createElement("br"));
      }

      if (localisation.expression) {
        div.appendChild(document.createTextNode("Testo: "));
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
    document.getElementById("expressionMainTitle").textContent = data.code;
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

  blockWork(work, results) {
    const div = document.createElement('div');
    div.setAttribute('class', 'row');

    const col = document.createElement('div');
    col.setAttribute('class', 'col');
    div.appendChild(col);

    const card = document.createElement('div');
    card.setAttribute('class', 'card');
    col.appendChild(card);

    const body = document.createElement('div');
    body.setAttribute('class', 'card-body');
    card.appendChild(body);

    const title = document.createElement('h5');
    body.appendChild(title);

    const anchor = document.createElement('a');
    anchor.href = this.baseurl + "/work?id=" + work.id;
    anchor.appendChild(document.createTextNode(work.code));
    title.appendChild(anchor);

    const subTitle = document.createElement("div");
    body.appendChild(subTitle);

    const subTitleContent = document.createElement("span");
    this.showLoaderInElement(subTitleContent);
    subTitle.appendChild(subTitleContent);

    this.blockWorkTitle(work, subTitleContent);

    if (results && results.length !== 0) {
      results.filter(result => !!result.fieldName).forEach(result => {
        const fieldName = document.createElement('div');
        fieldName.setAttribute("class", "font-weight-bold");
        body.appendChild(fieldName);
        fieldName.innerText = result.fieldName;

        const fieldValue = document.createElement('div');
        body.appendChild(fieldValue);
        fieldValue.innerHTML = result.fieldValue;
      });
    }

    return div;
  },

  blockPerson(person, results) {
    const div = document.createElement('div');
    div.setAttribute('class', 'row');

    const col = document.createElement('div');
    col.setAttribute('class', 'col');
    div.appendChild(col);

    const card = document.createElement('div');
    card.setAttribute('class', 'card');
    col.appendChild(card);

    const body = document.createElement('div');
    body.setAttribute('class', 'card-body');
    card.appendChild(body);

    const title = document.createElement('h5');
    body.appendChild(title);

    const anchor = document.createElement('a');
    anchor.href = this.baseurl + "/person?id=" + person.id;
    anchor.appendChild(document.createTextNode(person.name));
    title.appendChild(anchor);

    body.appendChild(document.createTextNode(`
      Numberi: ${person.works.length} schede,
      ${person.translations.length} traduzioni,
      ${person.codices.length} codici`));

    if (results && results.length !== 0) {
      results.filter(result => !!result.fieldName).forEach(result => {
        const fieldName = document.createElement('div');
        fieldName.setAttribute("class", "font-weight-bold");
        body.appendChild(fieldName);
        fieldName.innerText = result.fieldName;

        const fieldValue = document.createElement('div');
        body.appendChild(fieldValue);
        fieldValue.innerHTML = result.fieldValue;
      });
    }
    return div;
  },

  blockManuscript(manuscript, results, libraries) {
    const div = document.createElement('div');
    div.setAttribute('class', 'row');

    const col = document.createElement('div');
    col.setAttribute('class', 'col');
    div.appendChild(col);

    const card = document.createElement('div');
    card.setAttribute('class', 'card');
    col.appendChild(card);

    const body = document.createElement('div');
    body.setAttribute('class', 'card-body');
    card.appendChild(body);

    const title = document.createElement('h5');
    body.appendChild(title);

    const libraryId = parseInt(manuscript.library.substr(manuscript.library.lastIndexOf("/") + 1), 10);

    const library = libraries.find(library => library.id === libraryId);
    let name = library.libraryName + "¸ " + library.city + ", " + manuscript.shelfMark;

    const anchor = document.createElement('a');
    anchor.href = this.baseurl + "/manuscript?id=" + manuscript.id;
    anchor.appendChild(document.createTextNode(name));
    title.appendChild(anchor);
    console.log(manuscript)

    if (results && results.length !== 0) {
      results.filter(result => !!result.fieldName).forEach(result => {
        const fieldName = document.createElement('div');
        fieldName.setAttribute("class", "font-weight-bold");
        body.appendChild(fieldName);
        fieldName.innerText = result.fieldName;

        const fieldValue = document.createElement('div');
        body.appendChild(fieldValue);
        fieldValue.innerHTML = result.fieldValue;
      });
    }

    return div;
  },

  blockExpression(expression, results) {
    const div = document.createElement('div');
    div.setAttribute('class', 'row');

    const col = document.createElement('div');
    col.setAttribute('class', 'col');
    div.appendChild(col);

    const card = document.createElement('div');
    card.setAttribute('class', 'card');
    col.appendChild(card);

    const body = document.createElement('div');
    body.setAttribute('class', 'card-body');
    card.appendChild(body);

    const title = document.createElement('h5');
    body.appendChild(title);

    title.appendChild(document.createTextNode("Espressione "));

    const anchor = document.createElement('a');
    anchor.href = this.baseurl + "/expression?id=" + expression.id;
    anchor.appendChild(document.createTextNode(expression.code));
    title.appendChild(anchor);

    if (results && results.length !== 0) {
      results.filter(result => !!result.fieldName).forEach(result => {
        const fieldName = document.createElement('div');
        fieldName.setAttribute("class", "font-weight-bold");
        body.appendChild(fieldName);
        fieldName.innerText = result.fieldName;

        const fieldValue = document.createElement('div');
        body.appendChild(fieldValue);
        fieldValue.innerHTML = result.fieldValue;
      });
    }

    return div;
  },

  async blockWorkTitle(work, elm) {
    const author = await this.getDataWithFullPath(work.author);

    const promises = [];
    for (let i = 0; i < work.expressions.length; ++i) {
      const p = this.getDataWithFullPath(work.expressions[i]);
      promises.push(p);
    }

    const expressions = await Promise.all(promises);
    console.log(expressions);

    const topLevelExpressions = [];
    expressions.forEach(expression => {
      if (expression.derivedFromExpressions.length === 0) {
        topLevelExpressions.push(expression);
      }
    });

    elm.textContent = author.name + ", " + this.dedupArray(topLevelExpressions.map(e => e.title)).join(", ");
  },

  async search(search) {
    this.showLoader("resultsContainer");

    search = search.toLowerCase();

    const people = await this.getData("/people").then(people => people.map(person => {
      const results = SearchSettings.filterPerson(person, search);
      if (results.length === 0) {
        return null;
      }

      return {
        elm: this.blockPerson(person, results),
        priority: results.sort((a, b) => a.priority > b.priority)[0].priority,
      };
    }).filter(elm => !!elm));

    const works = await this.getData("/works").then(works => works.map(work => {
      const results = SearchSettings.filterWork(work, search);
      if (results.length === 0) {
        return null;
      }

      return {
        elm: this.blockWork(work, results),
        priority: results.sort((a, b) => a.priority > b.priority)[0].priority,
      };
    }).filter(elm => !!elm));

    // Let's fetch the libraries for the manuscript blocks.
    const libraries = await this.getData("/libraries");

    const manuscripts = await this.getData("/manuscripts").then(manuscripts => manuscripts.map(manuscript => {
      const results = SearchSettings.filterManuscript(manuscript, search);
      if (results.length === 0) {
        return null;
      }

      return {
        elm: this.blockManuscript(manuscript, results, libraries),
        priority: results.sort((a, b) => a.priority > b.priority)[0].priority,
      };
    }).filter(elm => !!elm));

    const expressions = await this.getData("/expressions").then(expressions => expressions.map(expression => {
      const results = SearchSettings.filterExpression(expression, search);
      if (results.length === 0) {
        return null;
      }

      return {
        elm: this.blockExpression(expression, results),
        priority: results.sort((a, b) => a.priority > b.priority)[0].priority,
      };
    }).filter(elm => !!elm));

    const elm = document.getElementById("resultsContainer");
    this.removeContent(elm);

    const results = people.concat(works).concat(manuscripts).concat(expressions);
    results.sort((a, b) => a.priority > b.priority);

    document.getElementById("searchMainTitle").textContent = "Risultati: " + results.length;

    const pageData = this.reducePagination(results);
    pageData.data.forEach(result => elm.appendChild(result.elm));
    this.showPagination(pageData);
  },

  reducePagination(data) {
    const totalPages = Math.ceil(data.length / this.itemsPerPage);

    const url = new URL(window.location);
    let currentPage = parseInt(url.searchParams.get("page"), 10) || 0;

    let fromItem = currentPage * this.itemsPerPage;
    if (fromItem >= data.length) {
      fromItem = 0;
      currentPage = 0;
    }

    return {
      data: data.splice(fromItem, this.itemsPerPage),
      currentPage: currentPage,
      totalPages: totalPages,
    }
  },

  showPagination(data) {
    const pagination = document.getElementById("pagination");
    this.removeContent(pagination);

    const url = new URL(window.location);

    function createElement(content, page) {
      const li = document.createElement("li");
      li.setAttribute("class", "page-item " + (page === data.currentPage ? "active" : ""));
      pagination.appendChild(li);

      const a = document.createElement("a");
      a.setAttribute("class", "page-link");
      li.appendChild(a);

      url.searchParams.set("page", page);

      a.href = url;
      a.textContent = content;
    }

    let min = Math.max(data.currentPage - 5 - (data.currentPage > data.totalPages - 5 ? 5 - (data.totalPages - data.currentPage) : 0), 0);
    let max = Math.min(data.currentPage + 5 + (data.currentPage < 5 ? 5 - data.currentPage : 0), data.totalPages - 1);

    if (data.currentPage > 0) {
      createElement("Precedente", data.currentPage - 1);
    }

    for (let i = min; i <= max; ++i) {
      createElement(i + 1, i);
    }

    if (data.currentPage < data.totalPages - 1) {
      createElement("Successivo", data.currentPage + 1);
    }
  },

  // Remove duplicates from an array of strings.
  dedupArray(array) {
    const results = [];

    array.forEach(elm => {
      if (!results.includes(elm)) {
        results.push(elm);
      }
    });

    return results;
  },

  preloadData(data) {
    for (let key in data) {
      this.cachedFetchedURLs.set(key, data[key]);
    }
  }
};

(function(exports){
  exports.Biflow = Biflow;
})(typeof exports === 'undefined'? this['mymodule']={}: exports);
