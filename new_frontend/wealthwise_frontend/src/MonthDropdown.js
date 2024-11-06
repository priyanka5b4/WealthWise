import React, { useState } from "react";
import Select from "react-select";
import Link from "./Link";
import { IoIosAddCircle } from "react-icons/io";
import { hover } from "@testing-library/user-event/dist/hover";
import { MdBorderColor } from "react-icons/md";

function MonthDropdown({
  selectedDate,
  setSelectedDate,
  filteredTransactions,
  dateOptions,
}) {
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

  const setDate = (selectedOption) => {
    setSelectedDate(selectedOption);
  };

  return (
    <>
      <div>
        <div style={{ border: "1px solid #2684FF", borderRadius: "5px" }}>
          <Select
            options={dateOptions}
            value={selectedDate}
            onChange={setDate}
            styles={customStyles}
            isSearchable={false} // Disable the search functionality
            components={{
              IndicatorSeparator: () => null,
            }}
          />
        </div>
        {/* <div>
          <h3>Filtered Transactions:</h3>
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id}>
              {transaction.date} - ${transaction.amount}
            </div>
          ))}
        </div> */}
      </div>
    </>
  );
}

export default MonthDropdown;
