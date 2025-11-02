"use client";

import { useEffect } from "react";
import * as d3 from "d3";

export function LogoTTS() {
  useEffect(() => {
    const svg = d3.select("#tree-logo");
    svg.selectAll("*").remove();

    const folderX = 0;
    const folderY = 30;
    const file1Y = 65;
    const file2Y = 100;
    const lineLength = 20;

    // Ícone da pasta
    svg.append("text")
      .attr("class", "fa-icon-pasta")
      .attr("x", folderX - 3)
      .attr("y", folderY)
      .text('\uf07b'); // 📁

    // Linha vertical central
    svg.append("line")
      .attr("class", "link")
      .attr("x1", folderX + 10)
      .attr("y1", folderY + 10)
      .attr("x2", folderX + 10)
      .attr("y2", file2Y + 1);

    // ├── primeiro arquivo
    svg.append("line")
      .attr("class", "link")
      .attr("x1", folderX + 10)
      .attr("y1", file1Y)
      .attr("x2", folderX + lineLength + 5)
      .attr("y2", file1Y);

    // └── segundo arquivo
    svg.append("line")
      .attr("class", "link")
      .attr("x1", folderX + 10)
      .attr("y1", file2Y)
      .attr("x2", folderX + lineLength + 5)
      .attr("y2", file2Y);

    // Arquivo 1
    svg.append("text")
      .attr("class", "fa-icon")
      .attr("x", folderX + lineLength + 5)
      .attr("y", file1Y)
      .text('\uf15b'); // 📄

    // Arquivo 2
    svg.append("text")
      .attr("class", "fa-icon")
      .attr("x", folderX + lineLength + 5)
      .attr("y", file2Y)
      .text('\uf15b'); // 📄
  }, []);

  return (
    <svg
      id="tree-logo"
      width={45}
      height={110}
      style={{ marginRight: "10px" }}
    />
  );
}
