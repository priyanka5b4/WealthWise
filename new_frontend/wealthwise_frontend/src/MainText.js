import React from "react";
import styles from "./MainText.module.css";
import Dropdown from "./Dropdown";

function MainText({ options, selectedInstitution, setSelectedInstitution }) {
  return (
    <div style={{ marginLeft: "10px", marginTop: "30px" }}>
      <div className={styles.textRow}>
        <h1 className={`${styles.largeG} ${styles.shinyText}`}>G</h1>
        <div className={styles.mainText}>
          <p>et</p>
        </div>
        <p className={styles.mainText} style={{ marginLeft: "10px" }}>
          {" "}
          to know about your Finances from{" "}
        </p>
        <div style={{ float: "left", margin: "10px" }}>
          <Dropdown
            options={options}
            selectedInstitution={selectedInstitution}
            setSelectedInstitution={setSelectedInstitution}
          />
        </div>{" "}
      </div>
      <div>
        <div
          className={styles.mainText}
          style={{ float: "left", marginLeft: "10px" }}
        >
          <p>in</p>
        </div>
      </div>
    </div>
  );
}

export default MainText;
