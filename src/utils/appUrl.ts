export const getAppBaseUrl = () => {
  const isProductionDomain = window.location.hostname === 'joiedevivre-africa.com' 
    || window.location.hostname === 'www.joiedevivre-africa.com';
  return isProductionDomain ? 'https://joiedevivre-africa.com' : window.location.origin;
};
