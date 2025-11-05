declare global {
  interface Window {
    loadSweetAlert?: () => Promise<any>;
    Swal?: any;
  }
}

export {};
