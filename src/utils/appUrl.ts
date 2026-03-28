export const getAppBaseUrl = () =>
  import.meta.env.PROD ? 'https://joiedevivre-africa.com' : window.location.origin;
