module.exports = ({defer}) => ({
 siteTitle : 'New Instance!',
  b: defer(function () {
    return 'this is '+this.fromList+'!';
  }),
  fromList: defer(function() {
    return this.list[2]*2;
  }),
  map: {
    centerPoint :  { lat: 3, lon: 4 },
  },
  original: {
    // An original value passed to deferred function
    original: defer(function (cfg, original) {
      return original;
    }),
    // This deferred function "skips" the previous one
    deferredOriginal: defer(function (cfg, original) {
      return original; // undefined
    })
  }
});
