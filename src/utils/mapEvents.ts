export const notifyMapInfoUpdated = () => {
  const event = new CustomEvent('mapinfo-updated');
  window.dispatchEvent(event);
};
