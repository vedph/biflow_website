const Search = {
  submit(e, form) {
    e.preventDefault();
    this.formdata(new FormData(form));
    return false;
  },

  formdata(formData) {
    let url = new URL(Biflow.baseurl + '/search', location);

    if (!formData) {
        location = url;
        return;
    }

    switch (formData.get("category")) {
      case 'work':
        url = new URL(Biflow.baseurl + '/works/', location);
        url.searchParams.set("filter", formData.get("search"))
        location = url;
        return;

      case 'manuscript':
        url = new URL(Biflow.baseurl + '/manuscripts/', location);
        url.searchParams.set("filter", formData.get("search"))
        location = url;
        return;

      case 'person':
        url = new URL(Biflow.baseurl + '/people/', location);
        url.searchParams.set("filter", formData.get("search"))
        location = url;
        return;

      case 'language':
        url = new URL(Biflow.baseurl + '/languages/', location);
        url.searchParams.set("filter", formData.get("search"))
        location = url;
        return;

      case 'genre':
        url = new URL(Biflow.baseurl + '/genres/', location);
        url.searchParams.set("filter", formData.get("search"))
        location = url;
        return;

      case 'library':
        url = new URL(Biflow.baseurl + '/libraries/', location);
        url.searchParams.set("filter", formData.get("search"))
        location = url;
        return;

      default:
        formData.forEach((value, key) => url.searchParams.append(key, value));
        location = url;
        return;
    }
  }
}
