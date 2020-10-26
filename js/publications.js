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

         const content = `
           <div class="card">
             <div class="row no-gutters">
               <div class="col-md-12">
                 <div class="card-body">
                   <div class="row">
                     <div class="col">
                       <div class="col" id="personBody">
                         <div class="row">
                           <div class="col-md-12">
                             <div class="w-100 divider-invisibile"></div>

                             <dl class="row riga-bt">
                               <dt class="col-sm-4">Autore</dt>
                               <dd class="col-sm-8">${publication.author}</dd>
                             </dl>

                             <dl class="row riga-bt">
                               <dt class="col-sm-4">Capitolo</dt>
                               <dd class="col-sm-8">${publication.chapter}</dd>
                             </dl>

                             <dl class="row riga-bt">
                               <dt class="col-sm-4">Editor</dt>
                               <dd class="col-sm-8">${publication.editor}</dd>
                             </dl>

                             <dl class="row riga-bt">
                               <dt class="col-sm-4">Volume</dt>
                               <dd class="col-sm-8">${publication.volume}</dd>
                             </dl>

                             <dl class="row riga-bt">
                               <dt class="col-sm-4">Posto</dt>
                               <dd class="col-sm-8">${publication.place}</dd>
                             </dl>

                             <dl class="row riga-bt">
                               <dt class="col-sm-4">Data</dt>
                               <dd class="col-sm-8">${publication.date}</dd>
                             </dl>

                             <dl class="row riga-bt">
                               <dt class="col-sm-4">URL</dt>
                               <dd class="col-sm-8">${publication.url}</dd>
                             </dl>

                             <dl class="row riga-bt">
                               <dt class="col-sm-4">Editore</dt>
                               <dd class="col-sm-8">${publication.publisher}</dd>
                             </dl>

                             <dl class="row riga-bt">
                               <dt class="col-sm-4">Volume</dt>
                               <dd class="col-sm-8">${publication.volume}</dd>
                             </dl>

                             <dl class="row riga-bt">
                               <dt class="col-sm-4">Volume numero</dt>
                               <dd class="col-sm-8">${publication.volumeNumber}</dd>
                             </dl>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>`;

           elm.innerHTML += content;
       });
     });
  }
};
