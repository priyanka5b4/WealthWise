import { useState, useEffect } from "react";
import axios from "axios";

class Institutions {
  institutions = [];
  institutionListener = [];

  selectedInstitution = "All banks";

  constructor() {
    this.institutions = [];
  }

  getSelectedInstitution() {
    return this.selectedInstitution;
  }

  getInstitutionsList = () => {
    return new Promise((resolve, reject) => {
      axios
        .get("/api/institutions")
        .then((response) => {
          // console.log(response.data);
          this.callInstitutionListeners(response.data);
          resolve(response);
        })
        .catch((error) => {
          // console.log(error);
          reject(error);
        });
    });
  };

  registerInstitutionListener(listener) {
    this.institutionListener.push(listener);
    return this.institutionListener.length - 1;
  }

  unregisterInstitutionListener(index) {
    this.institutionListener.splice(index, 1);
  }

  callInstitutionListeners(updatedList) {
    this.institutionListener.forEach((listener) => {
      listener(updatedList);
    });
  }
}

let InstitutionService = null;
export const GetInstitutionService = () => {
  if (!InstitutionService) {
    InstitutionService = new Institutions();
  }
  return InstitutionService;
};
