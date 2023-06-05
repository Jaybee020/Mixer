import React from "react";
import Form from "./Form";
import { utils } from "ethers";
import { withdrawwithRelayer, withdrawBySelf } from "../helpers/main";
import { useState } from "react";

const Withdraw = ({ useRelayer, toggleFn, relayer }) => {
  const [message, setMessage] = useState("");
  const submit = async (data) => {
    try {
      const { secret, nullifier, receiverAddr, relayerAddr, fee } = data;
      var status;
      //if useRelayer is true withdraw via relayer system
      if (useRelayer) {
        const feeInOne = utils.parseEther(fee);
        status = await withdrawwithRelayer(
          parseInt(secret),
          parseInt(nullifier),
          receiverAddr,
          feeInOne,
          relayerAddr
        );
      } else {
        status = await withdrawBySelf(secret, nullifier, receiverAddr);
      }
      setMessage(status);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.msg);
      } else {
        setMessage("An error occured.Check your input values");
      }
    }
  };
  return (
    <Form
      submitFn={submit}
      type={"Withdraw"}
      useRelayer={useRelayer}
      toggleFn={toggleFn}
      message={message}
      relayer={relayer}
    ></Form>
  );
};

export default Withdraw;
