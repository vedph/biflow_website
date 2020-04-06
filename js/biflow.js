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

  filterLanguage(language, filter) {
    return this.filterGeneric(language, filter, [
      { field: 'language', priority: 1, name: null, },
    ]);
  },

  filterGenre(genre, filter) {
    return this.filterGeneric(genre, filter, [
      { field: 'genre', priority: 1, name: null, },
    ]);
  },

  filterLibrary(library, filter) {
    return this.filterGeneric(library, filter, [
      { field: 'libraryName', priority: 1, name: null, },
      { field: 'city', priority: 2, name: null, },
      { field: 'libraryCode', priority: 2, name: null, },
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

const FilterSettings = {
  person: [
    {
      name: "Tipologia",
      id: "person_typology",
      type: "select",
      list: () => [ {
        name: "Autore",
        value: "author",
      }, {
        name: "Copista",
        value: "copyist",
      }, {
        name: "Traduttore",
        value: "translator",
      },],
      filter: (person, type) => {
        switch (type) {
          case "author":
            return person.works.length > 0;
          case "copyist":
            return person.codices.length > 0;
          case "translator":
            return person.translations.length > 0;
          default:
            alert("Invalid person type!");
        }
        return true;
      }
    },
    {
      name: "Data di nascita",
      id: "person_date_birth",
      type: "date",
      filter: (person, date) => {
        return SearchSettings.dateFilter(person.dateBirth, date);
      }
    },
    {
      name: "Data di morte",
      id: "person_date_death",
      type: "date",
      filter: (person, date) => {
        return SearchSettings.dateFilter(person.dateDeath, date);
      }
    },
  ],

  work: [
    {
      name: "Genere",
      id: "work_genre",
      type: "select",
      list: async () => {
        const list = [];

        const genres = await Biflow.getData("/genres");
        genres.forEach(genre => {
          list.push({ name: genre.genre, value: genre.id });
        });

        return list;
      },
      filter: (work, type) => {
        for (const genre of work.genres) {
          const genreId = genre.substr(genre.lastIndexOf("/") +1);
          if (genreId === type) {
            return true;
          }
        }
        return false;
      }
    },
  ],

  manuscript: [
    {
      name: "Data",
      id: "manuscript_date",
      type: "date",
      filter: (manuscript, date) => {
        return SearchSettings.dateFilter(manuscript.date, date);
      },
    }
  ],

  async updateFilterFields(type) {
    const elm = document.getElementById("filterBody");
    Biflow.removeContent(elm);

    switch (type) {
      case "person":
        await this.updateFilterFieldsInternal(elm, FilterSettings.person);
        break;

      case "work":
        await this.updateFilterFieldsInternal(elm, FilterSettings.work);
        break;

      case "manuscript":
        await this.updateFilterFieldsInternal(elm, FilterSettings.manuscript);
        break;

      default:
        alert("Invalid filter type: " + type);
    }
  },

  async updateFilterFieldsInternal(elm, fields) {
    for (let field of fields) {
      const title = document.createElement("h5");
      title.setAttribute("class", "card-title");
      title.textContent = field.name;
      elm.appendChild(title);

      switch (field.type) {
        case "select":
          await this.createSelect(elm, field);
          break;

        case "date":
          this.createDate(elm, field);
          break;

        default:
          alert("Invalid filter type: " + field.type);
      }
    }
  },

  async createSelect(elm, field) {
    const select = document.createElement("select");
    select.setAttribute("class", "form-control");
    select.setAttribute("name", field.id);
    elm.appendChild(select);

    const option = document.createElement("option");
    option.value = "";
    select.appendChild(option);

    const receivedValue = new URL(location).searchParams.get(field.id);

    const items = await field.list();
    items.forEach(item => {
      const option = document.createElement("option");
      option.textContent = item.name;
      option.value = item.value;

      if (receivedValue == item.value) {
        option.selected = true;
      }

      select.appendChild(option);
    });
  },

  createDate(elm, field) {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("class", "form-control datepiker");
    input.setAttribute("name", field.id);
    input.placeholder="GG/MM/AAAA";
    elm.appendChild(input);

    const receivedValue = new URL(location).searchParams.get(field.id);
    input.value = receivedValue;

    const desc = document.createElement("p");
    desc.textContent = "Formato date supportato:";
    elm.appendChild(desc);

    const ul = document.createElement("ul");
    elm.appendChild(ul);

    [
      ["1200", "Ricerca l'anno preciso"],
      ["05-1200", "Ricerca anno e mese"],
      ["12-05-1264", "Rircerca una data precisa"],
    ].forEach(item => {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = item[0];
      li.appendChild(strong);
      li.appendChild(document.createTextNode(" " + item[1]));
      ul.appendChild(li);
    })
  },

  filter(object, type) {
    switch (type) {
      case "person":
        return this.filterInternal(object, FilterSettings.person);

      case "work":
        return this.filterInternal(object, FilterSettings.work);

      case "manuscript":
        return this.filterInternal(object, FilterSettings.manuscript);

      default:
        alert("Invalid filter type: " + type);
        return null;
    }
  },

  filterInternal(object, fields) {
    const sp = new URL(location).searchParams;

    for (let i = 0; i < fields.length; ++i) {
      const field = fields[i];
      if (!sp.has(field.id) || sp.get(field.id) === "") {
        continue;
      }

      if (!field.filter(object, sp.get(field.id))) {
        return false;
      }
    }

    return true;
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

    // If the filter engine says no, this item should be ignored.
    data = data.filter(person => FilterSettings.filter(person, "person"));

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

    // If the filter engine says no, this item should be ignored.
    data = data.filter(manuscript => FilterSettings.filter(manuscript, "manuscript"));

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

  async showLibraries(elmName, filter) {
    this.showLoader(elmName);

    let data = await this.getData("/libraries");

    data = data.map(library => {
      let results = [];
      if (filter) {
        results = SearchSettings.filterLibrary(library, filter);
      }

      return { library, results, }
    });

    if (filter) {
      data = data.filter(library => library.results.length !== 0);
    }

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const pageData = this.reducePagination(data);
    pageData.data.forEach(library => this.showLibrary(elm, library));
    this.showPagination(pageData);
  },

  showLibrary(elm, library) {
    const b = this.blockLibrary(library.library, library.results);
    elm.appendChild(b);
  },

  blockLibrary(library, results) {
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
    anchor.href = this.baseurl + "/library?id=" + library.id;
    anchor.appendChild(document.createTextNode(library.libraryName));
    title.appendChild(anchor);

    if (library.libraryCode) {
      const subCity = document.createElement("div");
      body.appendChild(subCity);

      const subCityContent = document.createElement("span");
      subCity.textContent = "Codice: " + library.libraryCode;
    }

    if (library.city) {
      const subCity = document.createElement("div");
      body.appendChild(subCity);

      const subCityContent = document.createElement("span");
      subCity.textContent = "Città: " + library.city;
    }

    return div;
  },

  async showGenres(elmName, filter) {
    this.showLoader(elmName);

    let data = await this.getData("/genres");

    data = data.map(genre => {
      let results = [];
      if (filter) {
        results = SearchSettings.filterGenre(genre, filter);
      }

      return { genre, results, }
    });

    if (filter) {
      data = data.filter(genre => genre.results.length !== 0);
    }

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const pageData = this.reducePagination(data);
    pageData.data.forEach(genre => this.showGenre(elm, genre));
    this.showPagination(pageData);
  },

  showGenre(elm, genre) {
    const b = this.blockGenre(genre.genre, genre.results);
    elm.appendChild(b);
  },

  blockGenre(genre, results) {
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
    anchor.href = this.baseurl + "/genre?id=" + genre.id;
    anchor.appendChild(document.createTextNode(genre.genre));
    title.appendChild(anchor);

    return div;
  },

  async showLanguages(elmName, filter) {
    this.showLoader(elmName);

    let data = await this.getData("/languages");

    data = data.map(language => {
      let results = [];
      if (filter) {
        results = SearchSettings.filterLanguage(language, filter);
      }

      return { language, results, }
    });

    if (filter) {
      data = data.filter(language => language.results.length !== 0);
    }

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const pageData = this.reducePagination(data);
    pageData.data.forEach(language => this.showLanguage(elm, language));
    this.showPagination(pageData);
  },

  showLanguage(elm, language) {
    const b = this.blockLanguage(language.language, language.results);
    elm.appendChild(b);
  },

  blockLanguage(language, results) {
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
    anchor.href = this.baseurl + "/language?id=" + language.id;
    anchor.appendChild(document.createTextNode(language.language));
    title.appendChild(anchor);

    return div;
  },

  async showWorks(elmName, filter) {
    this.showLoader(elmName);

    let data = await this.getData("/works");
    data = data.filter(work => work.published);

    // If the filter engine says no, this item should be ignored.
    data = data.filter(work => FilterSettings.filter(work, "work"));

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

  //Visualise the full work
  async showFullWork(id) {
    // Let's show the loading for any active part of the page.
    ["workCode", "workCodeDownload", "workTitle", "workGenres",
     "workAuthor"].forEach(elmName => this.showLoader(elmName));

    // it gets the data from the server
    const data = await this.getData("/works/" + id);

    // Show the simple elements.
    document.getElementById("workMainTitle").textContent = data.code;
    document.getElementById("workCode").textContent = data.code;

    const downloadAnchor = document.getElementById("workCodeDownload");
    downloadAnchor.textContent = data.code;
    downloadAnchor.title = data.code;
    downloadAnchor.href = "worktoprint.html?id=" + data.id;

    // show the complex elements: elements connected to other elements.
    this.showWorkAuthor(data);
    this.showWorkGenres(data);
    this.showWorkTitle(data);

    //show elements only when they are not empty
    await this.showWorkDiagram(data);
    await this.showExpressionsCard(data.expressions, "workBody", "Versioni");
    this.maybeCreateCard("workBody", "Contenuto", data.content);
    this.maybeCreateCard("workBody", "Altre traduzioni", data.otherTranslations);
    this.maybeCreateCard("workBody", "Lavori collegati", data.relatedWorks);

    // This creates another card.
    await this.showWorkAttributions(data);

    // This creates another card.
    await this.showWorkBibliographies(data);

    await this.showEditor("workBody", "Autore della scheda:", data);
    await this.showWorkQuote(data);
  },

  async showWorkDiagram(data) {
    const expressions = [];

    for (let i = 0; i < data.expressions.length; ++i) {
      const expression = await this.getDataWithFullPath(data.expressions[i]);
      expressions.push(expression);
    }

    // Diagram.
    const dots = [];
    dots.push("digraph {");
    dots.push("node [shape=egg,style=filled,fillcolor=\"#2281c140\",fontname=\"Sans\",margin=0.2];");
    dots.push("rankdir=LR;");
    expressions.forEach(e => {
      dots.push(`"${e.code}" [URL="${this.baseurl}/expression?id=${e.id}"];`);
      e.derivedFromExpressions.forEach(de => {
        const id = parseInt(de.substr(de.lastIndexOf("/") +1), 10);
        de = expressions.find(ee => ee.id === id);
        dots.push(`"${de.code}" -> "${e.code}";`);
      });
    });
    dots.push("}");

    const url = new URL("https://mizar.unive.it/catalogo_biflow/graphviz/");
    url.searchParams.set("dot", btoa(dots.join("")));

    const svg = await fetch(url).then(r => r.text());
    //End Diagram

    this.maybeCreateCard("workBody", "Opera e relative versioni", svg, "workDiagram");
  },

  // This method creates a single card if there is something to show.
  maybeCreateCard(elmName, title, content, extraClass = "") {
    if (!content) {
      return;
    }

    const elm = document.getElementById(elmName);

    const card = document.createElement("div");
    card.setAttribute("class", "card");
    elm.appendChild(card);

    const header = document.createElement("div");
    header.setAttribute("class", "card-header font-weight-bold");
    header.textContent = title;
    card.appendChild(header);

    const body = document.createElement("div");
    body.setAttribute("class", "card-body " + extraClass);

    if (typeof content == "string" || typeof content == "number") {
      body.innerHTML = content;
    } else {
      body.appendChild(content);
    }

    card.appendChild(body);
  },

  // Show a list of expressions
  async showExpressionsCard(list, elmName, title) {
    if (list.length == 0) {
      return;
    }

    const expressions = [];

    for (let i = 0; i < list.length; ++i) {
      const expression = await this.getDataWithFullPath(list[i]);
      expressions.push(expression);
    }

    const ul = document.createElement("ul");
    ul.setAttribute("class", "list-group list-group-flush");

    expressions.forEach(expression => {
      //show a single expression.
      const li = document.createElement("li");
      li.setAttribute("class", "list-group-item list-group-item-action");
      ul.appendChild(li);

      const div = document.createElement('div');
      li.appendChild(div);

      div.appendChild(document.createTextNode("Codice: "));

      const anchor = document.createElement('a');
      anchor.href = this.baseurl + "/expression?id=" + expression.id;
      anchor.appendChild(document.createTextNode(expression.code));
      div.appendChild(anchor);

      div.appendChild(document.createElement("br"));
      div.appendChild(document.createTextNode("Titolo: "));
      div.appendChild(document.createTextNode(expression.title));
    });

    this.maybeCreateCard(elmName, title, ul);
  },

  async showEditor(elmName, title, data) {
    if (!data.editor) {
      return;
    }

    const editor = await this.getDataWithFullPath(data.editor);

    const elm = document.getElementById(elmName);

    const sep = document.createElement("div");
    sep.setAttribute("class", "w-100 divider-invisibile-doppio");
    elm.appendChild(sep);

    const row = document.createElement("dl");
    row.setAttribute("class", "row");
    elm.appendChild(row);

    const dt = document.createElement("dt");
    dt.setAttribute("class", "col-sm-3");
    dt.textContent = title;
    row.appendChild(dt);

    const dd = document.createElement("dd");
    dd.setAttribute("class", "col-sm-9");
    dd.textContent = editor.editor;
    row.appendChild(dd);
  },

  async showWorkTitle(data) {
    const topLevelExpressions = [];

    for (let i = 0; i < data.expressions.length; ++i) {
      const expression = await this.getDataWithFullPath(data.expressions[i]);
      if (expression.derivedFromExpressions.length === 0) {
        topLevelExpressions.push(expression);
      }
    }

    document.getElementById("workTitle").textContent = this.dedupArray(topLevelExpressions.map(e => e.title)).join(", ");
  },

  async showWorkQuote(data) {
    const quote = [];
    const editor = await this.getDataWithFullPath(data.editor);
    quote.push(editor.editor);
    quote.push("<em>"+data.code+"</em>");
    quote.push("in <em>Toscana Bilingue</em> - Catalogo Biflow, Venezia, ECF,  pubblicato il " + data.creationDate)

    const elm = document.getElementById("workBody");

    const row = document.createElement("dl");
    row.setAttribute("class", "row");
    elm.appendChild(row);

    const dt = document.createElement("dt");
    dt.setAttribute("class", "col-sm-3");
    dt.textContent = "Come citare questa scheda:";
    row.appendChild(dt);

    const dd = document.createElement("dd");
    dd.setAttribute("class", "col-sm-9");
    dd.innerHTML = quote.join(", ");
    row.appendChild(dd);
  },

  async showWorkBibliographies(data) {
    if (data.bibliographies.length == 0) {
      return;
    }

    const df = new DocumentFragment();
    await this.addBibliographyItems(df, data.bibliographies);

    this.maybeCreateCard("workBody", "Bibliografia", df);
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

      if (i > 0) {
        genres.push(document.createTextNode(", "));
      }

      const anchor = document.createElement("a");
      anchor.title = genreData.genre;
      anchor.textContent = genreData.genre;
      anchor.href = this.baseurl + "/genre?id=" + genreData.id;
      genres.push(anchor);
    }

    const elm = document.getElementById("workGenres");
    this.removeContent(elm);

    genres.forEach(genre => {
      elm.appendChild(genre);
    });
  },

  async showWorkAttributions(data) {
    if (data.attributions.length === 0) {
      return;
    }

    const attributions = [];
    for (let i = 0; i < data.attributions.length; ++i) {
      // This is the work-attribution.
      const attributionData = await this.getDataWithFullPath(data.attributions[i]);
      attributions.push(attributionData);
    }

    const ul = document.createElement("ul");
    ul.setAttribute("class", "list-group list-group-flush");

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

    this.maybeCreateCard("workBody", "Altre Attribuzioni", ul);
  },

  async showFullLibrary(id) {
    ["libraryCity", "libraryCode" ].forEach(elmName => this.showLoader(elmName));

    const data = await this.getData("/libraries/" + id);

    document.getElementById("libraryMainTitle").textContent = data.libraryName;
    document.getElementById("libraryCity").textContent = data.city;
    document.getElementById("libraryCode").textContent = data.libraryCode;

    await this.showLibraryManuscripts(data.manuscripts);
  },

  async showLibraryManuscripts(list) {
    if (list.length === 0) {
      return;
    }

    const ul = document.createElement("ul");
    ul.setAttribute("class", "list-group list-group-flush");

    for (let i = 0; i < list.length; ++i) {
      const manuscript = await this.getDataWithFullPath(list[i]);

      const li = document.createElement("li");
      li.setAttribute("class", "list-group-item list-group-item-action");
      ul.appendChild(li);

      const div = document.createElement('div');
      li.appendChild(div);

      div.appendChild(document.createTextNode("Manoscritto: "));
      let anchor = document.createElement('a');
      anchor.href = this.baseurl + "/manuscript?id=" + manuscript.id;
      anchor.appendChild(document.createTextNode(manuscript.shelfMark));
      div.appendChild(anchor);
    }

    this.maybeCreateCard("libraryBody", "Manoscritti", ul);
  },

  async showFullGenre(id) {
    const data = await this.getData("/genres/" + id);

    document.getElementById("genreMainTitle").textContent = data.genre;
    await this.showGenreWorksCard(data.works, "Schede");
  },

  // Show a list of expressions
  async showGenreWorksCard(list, elmName) {
    if (list.length == 0) {
      return;
    }

    const works = [];

    for (let i = 0; i < list.length; ++i) {
      const work = await this.getDataWithFullPath(list[i]);
      works.push(work);
    }

    const ul = document.createElement("ul");
    ul.setAttribute("class", "list-group list-group-flush");

    works.forEach(work => {
      //show a single work.
      const li = document.createElement("li");
      li.setAttribute("class", "list-group-item list-group-item-action");
      ul.appendChild(li);

      const div = document.createElement('div');
      li.appendChild(div);

      div.appendChild(document.createTextNode("Codice: "));

      const anchor = document.createElement('a');
      anchor.href = this.baseurl + "/work?id=" + work.id;
      anchor.appendChild(document.createTextNode(work.code));
      div.appendChild(anchor);
    });

    this.maybeCreateCard("genreBody", "Schede", ul);
  },

  async showFullLanguage(id) {
    const data = await this.getData("/languages/" + id);

    document.getElementById("languageMainTitle").textContent = data.language;

    await this.showExpressionsCard(data.expressions, "languageBody", "Versioni");
    await this.showExpressionsCard(data.otherExpressions, "languageBody", "Versioni multi-lingua");
  },

  async showFullManuscript(id) {
    // Let's show the loading for any active part of the page.
    ["manuscriptShelfMark", "manuscriptDate", "manuscriptLibrary", "manuscriptMaterial", "manuscriptShelfMarkDownload", "manuscriptTypology" ]
      .forEach(elmName => this.showLoader(elmName));

    const data = await this.getData("/manuscripts/" + id);
    const library = await this.getDataWithFullPath(data.library);

    //setting the download link anchor (manuscript.html)
    const downloadAnchor = document.getElementById("manuscriptShelfMarkDownload");
    downloadAnchor.textContent = data.shelfMark;
    downloadAnchor.title = data.shelfMark;
    downloadAnchor.href = "manuscripttoprint.html?id=" + data.id;

    // The simple elements.
    document.getElementById("manuscriptMainTitle").textContent = library.libraryCode + ", " + data.shelfMark;
    document.getElementById("manuscriptDate").textContent = data.date;
    document.getElementById("manuscriptShelfMark").textContent = data.shelfMark;
    document.getElementById("manuscriptPlace").textContent = data.place;

    this.showManuscriptLibrary(data);
    this.showManuscriptMaterial(data);
    this.showManuscriptTypology(data);

    // List of cards
    this.maybeCreateCard("manuscriptBody", "Descrizione Fisica", data.physDescription);
    this.maybeCreateCard("manuscriptBody", "Collazione", data.collationDescription);
    this.maybeCreateCard("manuscriptBody", "Larghezza", data.width);
    this.maybeCreateCard("manuscriptBody", "Altezza", data.height);
    await this.showManuscriptRuledLineTechnique(data);
    this.maybeCreateCard("manuscriptBody", "Sistema di rigatura", data.ruledLines);
    this.maybeCreateCard("manuscriptBody", "Scrittura", data.scriptDescription);
    this.maybeCreateCard("manuscriptBody", "Decorazione", data.decoDescription);
    this.maybeCreateCard("manuscriptBody", "Legatura", data.binding);
    this.maybeCreateCard("manuscriptBody", "Contenuto", data.content);
    this.maybeCreateCard("manuscriptBody", "Storia del codice", data.history);
    this.maybeCreateCard("manuscriptBody", "Note", data.note);
    await this.showManuscriptCheckStatus(data);
    await this.showLocalisationsCard(data.localisations, "manuscriptBody", "Localizazione");
    await this.showManuscriptBibliographies(data);

    await this.showEditor("manuscriptBody", "Autore della scheda del manoscritto:", data);
  },

  async showManuscriptTypology(data) {
    const typology = await this.getDataWithFullPath(data.typology);
    document.getElementById("manuscriptTypology").textContent = typology.typology;
  },

  async showManuscriptCheckStatus(data) {
    if (!data.checkStatus) {
      return;
    }

    const checkStatus = await this.getDataWithFullPath(data.checkStatus);
    this.maybeCreateCard("manuscriptBody", "Modalità di analisi", checkStatus.checkStatus);
  },

  async showManuscriptBibliographies(data) {
    if (data.bibliographies.length == 0) {
      return;
    }

    const df = new DocumentFragment();
    await this.addBibliographyItems(df, data.bibliographies);

    this.maybeCreateCard("manuscriptBody", "Bibliografia", df);
  },

  async showManuscriptLibrary(data) {
    const library = await this.getDataWithFullPath(data.library);
    const anchor = document.createElement("a");
    anchor.textContent = `
      Città: ${library.city} -
      Nome: ${library.libraryName} -
      Codice: ${library.libraryCode}
    `;
    anchor.title = anchor.textContent;
    anchor.href = this.baseurl + "/library?id=" + library.id;

    const elm = document.getElementById("manuscriptLibrary");
    this.removeContent(elm);
    elm.appendChild(anchor);
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
    if (!data.ruledLineTechnique) {
      return;
    }

    const ruledLineTechnique = await this.getDataWithFullPath(data.ruledLineTechnique);
    this.maybeCreateCard("manuscriptBody", "Tecnica di legatura",  ruledLineTechnique.ruledLineTechnique);
  },

  async showFullPerson(id) {
    // Let's show the loading for any active part of the page.
    ["personName", "personNicknames", "personBirthDate", "personDeathDate" ]
      .forEach(elmName => this.showLoader(elmName));

    const data = await this.getData("/people/" + id);

    // The simple elements.
    document.getElementById("personMainTitle").textContent = data.name;
    document.getElementById("personName").textContent = data.name;
    document.getElementById("personBirthDate").textContent = data.dateBirth;
    document.getElementById("personDeathDate").textContent = data.dateDeath;

    this.showPersonNicknames(data);

    // The cards.
    await this.showPersonWorks(data);
    await this.showExpressionsCard(data.translations, "personBody", "Traduttore");
    await this.showLocalisationsCard(data.codices, "personBody", "Copista");
  },

  async showLocalisationsCard(data, elmName, title) {
    if (data.length === 0) {
      return;
    }

    const localisations = [];
    for (let i = 0; i < data.length; ++i) {
      const localisationData = await this.getDataWithFullPath(data[i]);
      if (localisationData.manuscript) {
        localisationData.manuscript = await this.getDataWithFullPath(localisationData.manuscript);

        if (localisationData.manuscript.library) {
          localisationData.library = await this.getDataWithFullPath(localisationData.manuscript.library);
        }
      }

      if (localisationData.expression) {
        localisationData.expression = await this.getDataWithFullPath(localisationData.expression);
      }

      if (localisationData.copyist) {
        localisationData.copyist = await this.getDataWithFullPath(localisationData.copyist);
      }

      localisations.push(localisationData);
    }

    const ul = document.createElement("ul");
    ul.setAttribute("class", "list-group list-group-flush");

    localisations.forEach(localisation => {
      const li = document.createElement("li");
      li.setAttribute("class", "list-group-item list-group-item-action");
      ul.appendChild(li);

      const div = document.createElement('div');
      li.appendChild(div);

      if (localisation.manuscript) {
        div.appendChild(document.createTextNode("Manoscritto: "));
        let anchor = document.createElement('a');
        anchor.href = this.baseurl + "/manuscript?id=" + localisation.manuscript.id;
        anchor.appendChild(document.createTextNode(localisation.library.libraryCode + ", " + localisation.manuscript.shelfMark));
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

      div.appendChild(document.createTextNode("Localizzazione: "));
      div.appendChild(document.createTextNode(localisation.localisation));
      div.appendChild(document.createElement("br"));

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

    this.maybeCreateCard(elmName, title, ul);
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
    if (data.works.length == 0) {
       return;
    }

    const works = [];
    for (let i = 0; i < data.works.length; ++i) {
      works.push(await this.getDataWithFullPath(data.works[i]));
    }

    const ul = document.createElement("ul");
    ul.setAttribute("class", "list-group list-group-flush");

    works.forEach(work => {
      const li = document.createElement("li");
      li.setAttribute("class", "list-group-item list-group-item-action");
      ul.appendChild(li);

      const div = document.createElement('div');
      li.appendChild(div);

      div.appendChild(document.createTextNode("Codice: "));

      const anchor = document.createElement('a');
      anchor.href = this.baseurl + "/work?id=" + work.id;
      anchor.appendChild(document.createTextNode(work.code));
      div.appendChild(anchor);
    });

    this.maybeCreateCard("personBody", "Autore", ul);
  },

  async showFullExpression(id) {
    // Let's show the loading for any active part of the page.
    [ "expressionCode", "expressionDate", "expressionLanguage",
      "expressionTitle", "expressionWork",
      "expressionTranslator", "expressionDerivedFrom",
      "expressionTextualTypology", "expressionOtherLanguages",
     ]
      .forEach(elmName => this.showLoader(elmName));

    const data = await this.getData("/expressions/" + id);

    // The simple elements.
    document.getElementById("expressionMainTitle").textContent = data.code;
    document.getElementById("expressionCode").textContent = data.code;
    document.getElementById("expressionDate").textContent = data.date;
    document.getElementById("expressionTitle").textContent = data.title;

    // The complex ones.
    this.showExpressionLanguage(data);
    this.showExpressionOtherLanguages(data);
    this.showExpressionWork(data);
    this.showExpressionTranslator(data);
    this.showExpressionTextualTypology(data);
    this.showExpressionDerivedFrom(data);

    // The cards.
    this.maybeCreateCard("expressionBody", "Storia editoriale", data.editionHistory);
    this.maybeCreateCard("expressionBody", "Incipt", data.incipit);
    this.maybeCreateCard("expressionBody", "Explicit", data.explicit);
    this.maybeCreateCard("expressionBody", "Storia testuale", data.textualHistory);;
    this.maybeCreateCard("expressionBody", "Sintesi della tradizione manoscritta", data.manuscriptTradition);
    await this.showLocalisationsCard(data.localisations, "expressionBody", "Tradizione manoscritta");
    await this.showExpressionsCard(data.derivedExpressions, "expressionBody", "Espressioni derivate");
  },

  async showExpressionLanguage(data) {
    const language = await this.getDataWithFullPath(data.language);

    const elm = document.getElementById("expressionLanguage");
    this.removeContent(elm);

    const anchor = document.createElement("a");
    anchor.title = language.language;
    anchor.textContent = language.language;
    anchor.href = this.baseurl + "/language?id=" + language.id;
    elm.appendChild(anchor);
  },

  async showExpressionOtherLanguages(data) {
    const languages = [];

    for (let i = 0; i < data.otherLanguages.length; ++i) {
      const language = await this.getDataWithFullPath(data.otherLanguages[i]);

      if (i > 0) {
        languages.push(document.createTextNode(", "));
      }

      const anchor = document.createElement("a");
      anchor.title = language.language;
      anchor.textContent = language.language;
      anchor.href = this.baseurl + "/language?id=" + language.id;

      languages.push(anchor);
    }

    const elm = document.getElementById("expressionOtherLanguages");
    this.removeContent(elm);

    languages.forEach(language => elm.appendChild(language));
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

  //this is the description of a single manuscript in the list
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

    const libraryCodeId = parseInt(manuscript.library.substr(manuscript.library.lastIndexOf("/") + 1), 10);

    const library = libraries.find(library => library.id === libraryCodeId);
    let name = library.libraryCode + "¸  " + manuscript.shelfMark;

    const anchor = document.createElement('a');
    anchor.href = this.baseurl + "/manuscript?id=" + manuscript.id;
    anchor.appendChild(document.createTextNode(name));
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
    const libraryData = await this.getData("/libraries");

    const manuscripts = await this.getData("/manuscripts").then(manuscripts => manuscripts.map(manuscript => {
      const results = SearchSettings.filterManuscript(manuscript, search);
      if (results.length === 0) {
        return null;
      }

      return {
        elm: this.blockManuscript(manuscript, results, libraryData),
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

    const genres = await this.getData("/genres").then(genres => genres.map(genre => {
      const results = SearchSettings.filterGenre(genre, search);
      if (results.length === 0) {
        return null;
      }

      return {
        elm: this.blockGenre(genre, results),
        priority: results.sort((a, b) => a.priority > b.priority)[0].priority,
      };
    }).filter(elm => !!elm));

    const libraries = await this.getData("/libraries").then(libraries => libraries.map(library => {
      const results = SearchSettings.filterLibrary(library, search);
      if (results.length === 0) {
        return null;
      }

      return {
        elm: this.blockLibrary(library, results),
        priority: results.sort((a, b) => a.priority > b.priority)[0].priority,
      };
    }).filter(elm => !!elm));

    const languages = await this.getData("/languages").then(languages => languages.map(language => {
      const results = SearchSettings.filterLanguage(language, search);
      if (results.length === 0) {
        return null;
      }

      return {
        elm: this.blockLanguage(language, results),
        priority: results.sort((a, b) => a.priority > b.priority)[0].priority,
      };
    }).filter(elm => !!elm));

    const elm = document.getElementById("resultsContainer");
    this.removeContent(elm);

    const results = people.concat(works).concat(manuscripts).concat(expressions).concat(genres).concat(libraries).concat(languages);
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
