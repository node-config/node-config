// Local configuration overrides
module.exports = {
  test: {
	  parm_2:"Local deployment parm 2 override"
  },
  
  // Development is done on the dev instances,
  // Testing is done on pre instances
  channel: {
    service_host: 'accounts-pre'
  },
  media: {
    api_host: 'api-pre'
  }
  
};
