const Publications = {
  async showPublications() {
    const elm = document.getElementById("publications");
    Biflow.showLoaderInElement(elm);

    const categories = await Biflow.getData("/publication_categories");
    const publications = await Biflow.getData("/publications");
    Biflow.removeContent(elm);

    categories.forEach(category => {
      const link = document.createElement("a");
      link.setAttribute("href", "#" + category.publicationCategory);
      link.appendChild(document.createTextNode(category.publicationCategory))
      elm.appendChild(link);
      const br = document.createElement("br");
      elm.appendChild(br)
    }
      )

    categories.forEach(category => {

      const link = document.createElement("a");
      link.setAttribute("id", category.publicationCategory);
      elm.appendChild(link);

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

        let value = publication.author + ", <em>" +
                    publication.title + "</em>";
        console.log(publication)
        if (publication.chapter) {
          value += ", in " + publication.chapter;
        }

        if (publication.journal) {
          value += ", in " + publication.journal;
          if (publication.journalNumber) {
            value += ", " + publication.journalNumber;
          }
        }

        if (publication.editor) {
          value += ", a cura di " + publication.editor;
        }

        if (publication.place && publication.publisher) {
          value += ", " + publication.place + ", " + publication.publisher;
        }

        if (publication.date) {
          value += " (" + publication.date + ")";
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
          value += ", " + "<a href=\""+ publication.url + "\">" + publication.url + "</a>"
        }

	if (publication.abstract) {
          value += "<div class='abstract'>" + "<u>" + "Abstract" + "</u>" + ": " + publication.abstract + "</div>";
	}

        const li = document.createElement("li");
        li.innerHTML = value;
        ul.appendChild(li);
      });
    });
  }
};
