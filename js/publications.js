const Publications = {
  async showPublications() {
    const elm = document.getElementById("publications");
    Biflow.showLoaderInElement(elm);

    const categories = await Biflow.getData("/publication_categories");
    const publications = await Biflow.getData("/publications");
    Biflow.removeContent(elm);

    categories.forEach(category => {
      const container = document.createElement("div");
      container.setAttribute("class", "container");

      const row = document.createElement("div");
      row.setAttribute("class", "row");
      container.appendChild(row);

      const col = document.createElement("div");
      col.setAttribute("class", "col");
      row.appendChild(col);

      const title = document.createElement("h2");
      title.innerText = category.publicationCategory;
      col.appendChild(title);

      elm.appendChild(container);

      publications.forEach(publication => {
        if (publication.category !== "/catalogo_biflow/api/public/api/publication_categories/" + category.id) {
          return;
        }

        const ul = document.createElement("ul");
        elm.appendChild(ul);

        let value = publication.author + ", " +
                    publication.title;

        if (publication.chapter) {
          value += ", in " + publication.chapter;
        }

        if (publication.journal) {
          value += ", in " + publication.journal + ", " + publication.journalNumber;
        }

        if (publication.editor) {
          value += ", a cura di " + publication.editor;
        }

        if (publication.place && publication.publisher) {
          value += ", " + publication.place + ", " + publication.publisher;

          if (publication.date) {
            value += " (" + publication.date + ")";
          }
        }

        if (publication.volume) {
          value += ", " + publication.volume;

          if (publication.volumeNumber) {
            value += " - " + publication.volumeNumber;
          }
        }

        if (publication.pageNumber) {
          value += ", " + publication.pageNumber;
        }

        if (publication.url) {
          value += ", " + publication.url;
        }

        const li = document.createElement("li");
        li.textContent = value;
        ul.appendChild(li);
      });
    });
  }
};
