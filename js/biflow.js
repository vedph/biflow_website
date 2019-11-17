const Biflow = {
  URL: "https://mizar.unive.it",
  path: "/catalogo_biflow/api/public/api",

  updateCounters() {
    this.updateCounter("counter-works", "/works");
    this.updateCounter("counter-manuscripts", "/manuscripts");
    this.updateCounter("counter-translators", "/people",
      person => person.translations.length > 0);
    this.updateCounter("counter-copysts", "/people",
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
    anchor.href = "/person?id=" + person.id;
    anchor.appendChild(document.createTextNode(person.name));
    div.appendChild(anchor);

    div.appendChild(document.createElement("br"));
    div.appendChild(document.createTextNode(`
      Numbers: ${person.works.length} works,
      ${person.translations.length} translations,
      ${person.codices.length} codices`));
  },

  async showWorks(elmName, filter) {
    this.showLoader(elmName);

    const data = await this.getData("/works");

    const elm = document.getElementById(elmName);
    this.removeContent(elm);

    const ul = document.createElement("ul");
    elm.appendChild(ul);

    data.forEach(work => this.showWork(ul, work, filter));
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
    anchor.href = "/work?id=" + work.id;
    anchor.appendChild(document.createTextNode(work.code));
    div.appendChild(anchor);

    div.appendChild(document.createElement("br"));
    const p = document.createElement('p');
    div.appendChild(p);
    p.innerHTML = work.content;
  },

  async showFullWork(id) {
    // Let's show the loading for any active part of the page.
    ["workCode", "workTitle", "workGenres", "workContent", "workOtherTranslations",
     "workAuthor", "workRelatedWorks"].forEach(elmName => this.showLoader(elmName));
    ["workAttributions", "workExpressions"].forEach(elmName => this.showLoaderInUL(elmName));

    const data = await this.getData("/works/" + id);

    // The simple elements.
    document.getElementById("workMainTitle").textContent = "Scheda opera: " + data.code;
    document.getElementById("workCode").textContent = data.code;
    document.getElementById("workContent").innerHTML = data.content;
    document.getElementById("workOtherTranslations").innerHTML = data.otherTranslations;
    document.getElementById("workRelatedWorks").innerHTML = data.relatedWorks;

    // The complex ones.
    this.showWorkAuthor(data);
    this.showWorkAttributions(data);
    this.showWorkGenres(data);
    this.showExpressions(data.expressions, "workTitle", "workExpressions");
  },

  async showExpressions(list, elmTitleName, elmName) {
    const expressions = [];
    const titles = [];

    for (let i = 0; i < list.length; ++i) {
      const expression = await this.getDataWithFullPath(list[i]);
      if (!expression.derivedFrom) {
        titles.push(expression.title);
      }
      expressions.push(expression);
    }

    if (elmTitleName) {
      document.getElementById(elmTitleName).textContent = titles.join(", ");
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
      anchor.href = "/expression?id=" + expression.id;
      anchor.appendChild(document.createTextNode(expression.code));
      div.appendChild(anchor);

      div.appendChild(document.createElement("br"));
      div.appendChild(document.createTextNode("Titolo: "));
      div.appendChild(document.createTextNode(expression.title));
    });
  },

  async showWorkAuthor(data) {
    const author = await this.getDataWithFullPath(data.author);

    const a = document.createElement("a"); 
    a.textContent = author.name;
    a.href = "/person?id=" + author.id;

    const elm = document.getElementById("workAuthor");
    this.removeContent(elm);
    elm.appendChild(a);
  },

  async showWorkGenres(data) {
    const genres = [];
    for (let i = 0; i < data.genres.length; ++i) {
      // This is the work-genre.
      const workGenreData = await this.getDataWithFullPath(data.genres[i]);
      // This is the genre.
      const genreData = await this.getDataWithFullPath(workGenreData.genre);
      genres.push(genreData.genre);
    }
    document.getElementById("workGenres").textContent = genres.join(", ");
  },

  async showWorkAttributions(data) {
    const attributions = [];
    for (let i = 0; i < data.attributions.length; ++i) {
      // This is the work-attribution.
      const workGenreData = await this.getDataWithFullPath(data.attributions[i]);
      // This is the attribution.
      const attributionData = await this.getDataWithFullPath(workGenreData.attribution);
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
      anchor.href = "/person?id=" + attribution.id;
      anchor.appendChild(document.createTextNode(attribution.name));
      div.appendChild(anchor);
    });
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
    this.showExpressions(data.translations, null, "personTranslations");
    // TODO: codices
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
      anchor.href = "/work?id=" + work.id;
      anchor.appendChild(document.createTextNode(work.code));
      div.appendChild(anchor);
    });
  },
};
