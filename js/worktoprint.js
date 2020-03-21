function maybeAddBlock(df, title, content) {
  if (content != "") {
    const contentLabel = document.createElement("strong");
    contentLabel.textContent = title + " ";
    df.appendChild(contentLabel);

    const contentValue = document.createElement("span");
    contentValue.innerHTML = content;
    df.appendChild(contentValue);
    df.appendChild(document.createElement("br"));
    df.appendChild(document.createElement("br"));
  }
}

async function getPersonString(authorId) {
  // Fetch the author data from the REST API.
  const author = await Biflow.getDataWithFullPath(authorId);

  // For each nickname, I fetch the data from the REST API too.
  // All the nicknames are stored into the `nicknames` array.
  const nicknames = [];
  for (let i = 0; i < author.nicknames.length; ++i) {
    const nickname = await Biflow.getDataWithFullPath(author.nicknames[i]);
    nicknames.push(nickname.nickname);
  }

  // The final nickname string has this syntax "[" + list of nicknames + "]".
  let nicknameString = "";
  if (nicknames.length) {
    nicknameString = " [" + nicknames.join(", ") + "]";
  }

  // Date string.
  let dates = "";
  if (author.dateBirth || author.dateDeath) {
    dates = " (" + author.dateBirth + " - " + author.dateDeath + ")";
  }

  // Finally, the author string.
  return author.name + nicknameString + dates;
}

//Genres
async function getGenresString(genres) {
  const valueGenre = [];
  for (let i = 0; i < genres.length; ++i) {
    const genre = await Biflow.getDataWithFullPath(genres[i]);
    valueGenre.push(genre.genre);  
  }
  return valueGenre.join(", ");
}

// Bibliographies
async function addBibliographyItems(df, bibliographies) {
  const bibliographyLabel = document.createElement("strong");
  bibliographyLabel.textContent = "Bibliografia:";
  df.appendChild(bibliographyLabel);
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
}

// Expressions
async function addExpressionItems(df, expressions) {
  for (let i = 0; i < expressions.length; ++i) {
    const expression = await Biflow.getDataWithFullPath(expressions[i]);
    await addExpressionItem(df, expression);
  }
}

async function addExpressionItem(df, expression) {
  addTitle(df, expression.code);

  if (expression.translator) {
    const translator = await getPersonString(expression.translator);
    maybeAddBlock(df, "Traduttore:", translator);
  }

  maybeAddAttributions(df, expression.attributions);

  maybeAddBlock(df, "Titolo:", expression.title);
  maybeAddBlock(df, "Incipt:", expression.incipit);
  maybeAddBlock(df, "Explicit:", expression.explicit);
  maybeAddBlock(df, "Datazione:", expression.date);
  maybeAddBlock(df, "Storia editoriale:", expression.editionHistory);
  maybeAddBlock(df, "Tradizione manoscritta:", expression.editionHistory);
  maybeAddBlock(df, "Storia testuale:", expression.textualHistory);

  if (expression.language) {
    const language = await Biflow.getDataWithFullPath(expression.language);
    maybeAddBlock(df, "Lingua:", language.language);
  }

  if (expression.textualTypology) {
    const textualTypology = await Biflow.getDataWithFullPath(expression.textualTypology);
    maybeAddBlock(df, "Tipologia testuale:", textualTypology.textualTypology);
  }

  await addLocalisationItems(df, expression.localisations);
}

async function addLocalisationItems(df, localisations) {
  const manuscriptLabel = document.createElement("strong");
  manuscriptLabel.textContent = "Manoscritti:";
  df.appendChild(manuscriptLabel);
  df.appendChild(document.createElement("br"));

  const ul = document.createElement("ul");
  df.appendChild(ul);

  for (let i = 0; i < localisations.length; ++i) {
    const localisation = await Biflow.getDataWithFullPath(localisations[i]);

    const li = document.createElement("li");
    ul.appendChild(li);

    const manuscript = await Biflow.getDataWithFullPath(localisation.manuscript);

    const library = await Biflow.getDataWithFullPath(manuscript.library);

    let value = `${library.libraryCode} ${manuscript.shelfMark}  = ${library.city}, ${library.libraryName}, ${manuscript.shelfMark}`;
    li.appendChild(document.createTextNode(value));
    li.appendChild(document.createElement("br"));
    li.appendChild(document.createTextNode(`Datazione: ${manuscript.date}`));
    li.appendChild(document.createElement("br"));

    li.appendChild(document.createTextNode("Descrizione:"));
    const desc = document.createElement("span");
    desc.innerHTML = manuscript.physDescription;
    li.appendChild(desc);

    li.appendChild(document.createElement("br"));
    li.appendChild(document.createTextNode(`Localizzazione: ${localisation.localisation}`));
    li.appendChild(document.createElement("br"));

    if (localisation.copyist) {
      const copyist = await getPersonString(localisation.copyist);
      li.appendChild(document.createTextNode(`Copista: ${copyist}`));
      li.appendChild(document.createElement("br"));
    }

    if (manuscript.checkStatus) {
      const status = await Biflow.getDataWithFullPath(manuscript.checkStatus);
      li.appendChild(document.createTextNode(`${status.checkStatus}`));
      li.appendChild(document.createElement("br"));
    }
  }
}

async function maybeAddAttributions(df, attributions) {
  if (attributions.length) {
    const label = document.createElement("strong");
    label.textContent = "Altre attribuzioni:";
    df.appendChild(label);

    const ul = document.createElement("ul");
    df.appendChild(ul);

    for (let i = 0; i < attributions.length; ++i) {
      const attribution = await getPersonString(attributions[i]);

      const li = document.createElement("li");
      li.textContent = attribution;
      ul.appendChild(li);
    }
  }
}

function addTitle(df, code) {
  const elm = document.createElement("h1");
  elm.textContent = code;
  df.appendChild(elm);
}

async function generateDocument(workId) {
  const df = new DocumentFragment();

  const work = await Biflow.getData("/works/" + workId);

  addTitle(df, work.code);

  if (work.editor) {
    const editor = await Biflow.getDataWithFullPath(work.editor);
    maybeAddBlock(df, "Autore scheda:", editor.editor);
  }

  const author = await getPersonString(work.author);
  maybeAddBlock(df, "Autore:", author);

  maybeAddAttributions(df, work.attributions);

  maybeAddBlock(df, "Altre traduzioni:", work.otherTranslations);
  maybeAddBlock(df, "Contenuto:", work.content);
  maybeAddBlock(df, "Lavori collegati:", work.relatedWorks);

  const genres = await getGenresString(work.genres);
  maybeAddBlock(df, "Genere:", genres);

  await addExpressionItems(df, work.expressions);

  await addBibliographyItems(df, work.bibliographies);

  Biflow.removeContent(document.body);
  document.body.appendChild(df);
}

const url = new URL(window.location);
const workId = url.searchParams.get("id");
generateDocument(workId);
