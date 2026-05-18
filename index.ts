import { db } from "./db";
import fs from "fs";

// Fungsi untuk menyatukan konten halaman ke dalam template layout utama
function render(viewName: string, content: string): string {
  const layout = fs.readFileSync("./views/layout.html", "utf8");
  return layout.replace("{{content}}", content);
}

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // 1. HALAMAN UTAMA - LIST DATA (READ)
    if (path === "/" && method === "GET") {
      const [rows]: any = await db.query("SELECT * FROM mahasiswa");
      let tableRows = "";
      
      if (rows.length === 0) {
        tableRows = `<tr><td colspan="5" class="p-3 text-center text-gray-400">Belum ada data mahasiswa.</td></tr>`;
      } else {
        rows.forEach((m: any) => {
          tableRows += `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
              <td class="p-3">${m.id}</td>
              <td class="p-3 font-medium text-gray-700">${m.nama}</td>
              <td class="p-3">${m.jurusan}</td>
              <td class="p-3">${m.angkatan}</td>
              <td class="p-3 text-center flex justify-center gap-3">
                <a class="text-blue-500 hover:text-blue-700 font-semibold" href="/edit/${m.id}">Edit</a>
                <a class="text-red-500 hover:text-red-700 font-semibold" href="/hapus/${m.id}" onclick="return confirm('Yakin ingin menghapus data?')">Hapus</a>
              </td>
            </tr>
          `;
        });
      }

      let view = fs.readFileSync("./views/mahasiswa.html", "utf8");
      view = view.replace("{{rows}}", tableRows);
      
      return new Response(render("mahasiswa", view), {
        headers: { "Content-Type": "text/html" }
      });
    }

    // 2. HALAMAN FORM TAMBAH DATA (GET)
    if (path === "/tambah" && method === "GET") {
      let view = fs.readFileSync("./views/form.html", "utf8");
      view = view
        .replace("{{action}}", "/simpan")
        .replace("{{nama}}", "")
        .replace("{{jurusan}}", "")
        .replace("{{angkatan}}", "");

      return new Response(render("form", view), {
        headers: { "Content-Type": "text/html" }
      });
    }

    // 3. PROSES SIMPAN DATA BARU (POST)
    if (path === "/simpan" && method === "POST") {
      const formData = await req.formData();
      await db.query(
        "INSERT INTO mahasiswa (nama, jurusan, angkatan) VALUES (?, ?, ?)",
        [formData.get("nama"), formData.get("jurusan"), formData.get("angkatan")]
      );
      return Response.redirect("/", 302);
    }

    // 4. HALAMAN FORM EDIT DATA (GET - MENJAWAB TUGAS 1 MODUL)
    if (path.startsWith("/edit/") && method === "GET") {
      const id = path.split("/")[2];
      const [rows]: any = await db.query("SELECT * FROM mahasiswa WHERE id = ?", [id]);

      if (rows.length === 0) return new Response("Data mahasiswa tidak ditemukan", { status: 404 });
      const m = rows[0];

      let view = fs.readFileSync("./views/form.html", "utf8");
      view = view
        .replace("{{action}}", `/update/${id}`)
        .replace("{{nama}}", m.nama)
        .replace("{{jurusan}}", m.jurusan)
        .replace("{{angkatan}}", m.angkatan.toString());

      return new Response(render("form", view), {
        headers: { "Content-Type": "text/html" }
      });
    }

    // 5. PROSES UPDATE DATA (POST - MENJAWAB TUGAS 1 MODUL)
    if (path.startsWith("/update/") && method === "POST") {
      const id = path.split("/")[2];
      const formData = await req.formData();
      await db.query(
        "UPDATE mahasiswa SET nama = ?, jurusan = ?, angkatan = ? WHERE id = ?",
        [formData.get("nama"), formData.get("jurusan"), formData.get("angkatan"), id]
      );
      return Response.redirect("/", 302);
    }

    // 6. PROSES HAPUS DATA (GET)
    if (path.startsWith("/hapus/") && method === "GET") {
      const id = path.split("/")[2];
      await db.query("DELETE FROM mahasiswa WHERE id = ?", [id]);
      return Response.redirect("/", 302);
    }

    return new Response("Halaman Tidak Ditemukan", { status: 404 });
  }
});

console.log("Server running at http://localhost:3000");