import React from "react";
import Form from "./Form";
import { deposit } from "../helpers/main";
import { useEffect, useState } from "react";
import { getMixer } from "../helpers/helpers";

const Deposit = () => {
  const submit = async (data) => {
    try {
      const { secret, nullifier } = data;
      await deposit(parseInt(secret), parseInt(nullifier));
    } catch (error) {
      console.log(error);
      setMessage("An error occured during deposit");
    }
  };
  var [message, setMessage] = useState("");
  const [view, setView] = useState(false);

  useEffect(() => {
    const setValue = async () => {
      const mixer = await getMixer();
      const index = await mixer.getIndex();
      const depth = await mixer.getDepth();
      const root = await mixer.getRoot();
      console.log("this is the root", root, depth);
      setView(index.toNumber() + 1 === 256);
      setMessage(`Current Index in tree is ${index.toNumber()}`);
      mixer.on("Deposit", (commitment, index, timestamp) => {
        setMessage(
          `Deposit Successfully performed at  ${timestamp}. New Index is ${index}`
        );
        setView(index.toNumber() + 1 === 256);
      });
    };

    setValue();
  }, []);

  return (
    <Form
      view={view}
      submitFn={submit}
      type={"Deposit"}
      message={message}
    ></Form>
  );
};

export default Deposit;
