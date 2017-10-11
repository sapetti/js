function getUrl() {
      var connectUrl = location.protocol;
      connectUrl = connectUrl.concat("//");
      connectUrl = connectUrl.concat(window.location.hostname);
      connectUrl = connectUrl.concat(':'+window.location.port);
      return connectUrl;
}
