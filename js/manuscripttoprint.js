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

function addTitle(df, code) {
  const elm = document.createElement("h1");
  elm.textContent = code;
  df.appendChild(elm);
}

function addButton(df) {
  const button = document.createElement("button");
  button.textContent = "Stampa";
  df.appendChild(button);
  button.onclick = () => window.print();
}

// Bibliographies
async function addBibliographyItems(df, bibliographies) {
  const bibliographyLabel = document.createElement("strong");
  bibliographyLabel.textContent = "Bibliografia:";
  df.appendChild(bibliographyLabel);
  df.appendChild(document.createElement("br"));
  await Biflow.addBibliographyItems(df, bibliographies);
}

async function addLocalisations(df, localisations) {
  if (localisations.length === 0) {
    return;
  }

  for (let i = 0; i < localisations.length; ++i) {
    const localisation = await Biflow.getDataWithFullPath(localisations[i]);
    console.log(localisation);

    if (localisation.copyist) {
      const copyist = await Biflow.getDataWithFullPath(localisation.copyist);
      maybeAddBlock(df, "Copista:", copyist.name);
    }

    maybeAddBlock(df, "Data:", localisation.date);
    maybeAddBlock(df, "Note:", localisation.note);
    maybeAddBlock(df, "Localizazione:", localisation.localisation);
  }
}

async function generateDocument(manuscriptId) {
  const df = new DocumentFragment();

  const manuscript = await Biflow.getData("/manuscripts/" + manuscriptId);

  const library = await Biflow.getDataWithFullPath(manuscript.library);

  addTitle(df, library.libraryCode + ", " + manuscript.shelfMark);

  addButton(df);

  if (manuscript.editor) {
    const editor = await Biflow.getDataWithFullPath(manuscript.editor);
    maybeAddBlock(df, "Autore scheda: ", editor.editor);
  }

  maybeAddBlock(df, "Segnatura:", library.city + ", " + library.libraryName + ", " + manuscript.shelfMark);

  maybeAddBlock(df, "Luogo:", manuscript.place);
  maybeAddBlock(df, "Datazione:", manuscript.date);

  if (manuscript.typology) {
    const typology = await Biflow.getDataWithFullPath(manuscript.typology)
    maybeAddBlock(df, "Tipologia:", typology.typology);
  }

   if (manuscript.checkStatus){
    const checkStatus = await Biflow.getDataWithFullPath(manuscript.checkStatus)
    maybeAddBlock(df, "Modalità di analisi", checkStatus.checkStatus);
  }

  maybeAddBlock(df, "Descrizione materiale:", manuscript.physDescription);

  if (manuscript.material){
    const material = await Biflow.getDataWithFullPath(manuscript.material)
    maybeAddBlock(df, "Materiale:", material.material);
  }

  if (manuscript.ruledLineTechnique){
    const ruledLineTechnique = await Biflow.getDataWithFullPath(manuscript.ruledLineTechnique)
    maybeAddBlock(df, "Tecnica di rigatura:", ruledLineTechnique.ruledLineTechnique);
  }

  await addLocalisations(df, manuscript.localisations);

  maybeAddBlock(df, "Sistema di rigatura:", manuscript.ruledLines);
  maybeAddBlock(df, "Altezza:", manuscript.height);
  maybeAddBlock(df, "Larghezza:", manuscript.width);
  maybeAddBlock(df, "Storia del codice:", manuscript.history);
  maybeAddBlock(df, "Scrittura:", manuscript.scriptDescription);
  maybeAddBlock(df, "Decorazione:", manuscript.decoDescription);
  maybeAddBlock(df, "Collazione:", manuscript.collationDescription);
  maybeAddBlock(df, "Legatura:", manuscript.binding);
  maybeAddBlock(df, "Contenuto:", manuscript.content);
  maybeAddBlock(df, "Note:", manuscript.note);

  if (manuscript.link) {
    const link = `<a href="$ {manuscript.link}">${manuscript.link}</a>`;
    maybeAddBlock(df, "Link:", link);
  }
  
  if (manuscript.bibliographies.length !== 0) {
    await addBibliographyItems(df, manuscript.bibliographies);
  }
 
  Biflow.removeContent(document.body);
  document.body.appendChild(df);
}

const url = new URL(window.location);
const manuscriptId = url.searchParams.get("id");
generateDocument(manuscriptId);