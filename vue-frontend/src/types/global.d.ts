declare global {
  interface Window {
    loadSweetAlert?: () => Promise<any>;
    Swal?: any;
  }

  // interface DriveImage {
  //   id: string;
  //   name: string;
  //   thumbnailLink?: string;
  //   webContentLink?: string;
  //   mimeType: string;
  //   createdTime: string;
  //   modifiedTime: string;
  // }
}

export {};
