import React, { useEffect, useContext } from "react";
import { usePlaidLink } from "react-plaid-link";
import { IoIosAddCircle } from "react-icons/io";
import { LinkContext } from "./Context";
import { GetInstitutionService } from "./InstututionService";

const Link = () => {
  const linkToken = useContext(LinkContext);
  // console.log("linkToken", linkToken);
  const InstitutionService = GetInstitutionService();
  const onSuccess = React.useCallback(
    (public_token) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        const response = await fetch("/api/set_access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: `public_token=${public_token}`,
        });
        if (!response.ok) {
          // console.error("Failed to exchange public_token for access_token");
          return;
        } else {
          InstitutionService.getInstitutionsList().then((response) => {
            window.location.reload();
          });
        }
      };

      exchangePublicTokenForAccessToken();
    },
    [InstitutionService]
  );

  let isOauth = false;
  const config = {
    token: linkToken,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (isOauth && ready) {
      open();
    }
  }, [ready, open, isOauth]);

  return (
    <>
      <button onClick={() => open()} title="Add bank Details">
        <IoIosAddCircle
          style={{
            fontSize: "1.5em",
            color: "#2684FF",
            fontSize: "3em",
            marginRight: "10px",
          }}
        />
      </button>
    </>
  );
};

Link.displayName = "Link";

export default Link;
