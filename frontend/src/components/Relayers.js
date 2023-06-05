import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useState, useEffect } from "react";
import { getRelayers } from "../helpers/helpers";

export default function BasicTable() {
  const [relayers, setRelayers] = useState([]);

  useEffect(() => {
    const setRelayer = async () => {
      const result = await getRelayers(10);
      setRelayers(result);
    };

    setRelayer();
  }, []);

  return (
    <TableContainer>
      <Table
        style={{ backgroundColor: 111111 }}
        sx={{ minWidth: 650 }}
        aria-label="simple table"
      >
        <TableHead>
          <TableRow>
            <TableCell style={{ color: "white" }}>Address</TableCell>
            <TableCell style={{ color: "white" }} align="right">
              Fee Sum
            </TableCell>
            <TableCell style={{ color: "white" }} align="right">
              Count
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {relayers.map((row) => (
            <TableRow
              key={row.addr}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell style={{ color: "white" }} component="th" scope="row">
                {row.addr}
              </TableCell>
              <TableCell style={{ color: "white" }} align="right">
                {row.sum}
              </TableCell>
              <TableCell style={{ color: "white" }} align="right">
                {row.count}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
