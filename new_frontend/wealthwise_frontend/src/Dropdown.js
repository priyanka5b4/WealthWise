import React, { useEffect, useState } from "react";
import Select from "react-select";
import Link from "./Link";
import { IoIosAddCircle } from "react-icons/io";
import { hover } from "@testing-library/user-event/dist/hover";
import { MdBorderColor } from "react-icons/md";

function Dropdown({ options, selectedInstitution, setSelectedInstitution }) {
  // console.log("options", options, selectedInstitution);

  const customStyles = {
    control: (styles) => ({
      ...styles,
      hover: "#2684FF",
      backgroundColor: "white",
      padding: "5px 10px",
      border: "1px solid #ccc",
      borderRadius: "5px",
      MdBorderColor: "#2684FF",
      cursor: "pointer",
      outline: "none",
    }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: "white",
      color: isFocused ? "#2684FF" : "black",
      cursor: "pointer",
      lineHeight: "normal",
    }),

    container: (styles) => ({
      ...styles,
      width: "200px", // Set the width of the dropdown
    }),
  };

  const setInstitution = (selectedOption) => {
    setSelectedInstitution(selectedOption);
  };

  return (
    <>
      <div style={{ border: "1px solid #2684FF", borderRadius: "5px" }}>
        <Select
          options={options}
          value={selectedInstitution}
          onChange={setInstitution}
          styles={customStyles}
          isSearchable={false} // Disable the search functionality
          components={{
            IndicatorSeparator: () => null,
          }}
        />
      </div>
    </>
  );
}

export default Dropdown;
