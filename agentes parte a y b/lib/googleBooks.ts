const API_URL = 'https://www.googleapis.com/books/v1/volumes';

export async function buscarLibros(query: string, startIndex = 0, maxResults = 10) {
  console.log("🟢 [GoogleBooks] Buscando libros con query:", query);

  const url = `${API_URL}?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${maxResults}`;
  console.log("🌐 URL:", url);

  const res = await fetch(url);
  const data = await res.json();

  console.log("📘 [GoogleBooks] Service - Resultados obtenidos:", data.items?.length || 0);

  return (data.items || []).map((item: any) => ({
    id: item.id,
    title: item.volumeInfo?.title,
    authors: item.volumeInfo?.authors,
    description: item.volumeInfo?.description,
    publishedDate: item.volumeInfo?.publishedDate,
    pageCount: item.volumeInfo?.pageCount, 
    categories: item.volumeInfo?.categories,
    thumbnail: item.volumeInfo?.imageLinks?.thumbnail
    }));
}

export async function buscarLibroPorID(id: string) {
  console.log("🔍 [GoogleBooks] Buscando libro por ID:", id);

  const res = await fetch(`${API_URL}/${id}`);
  const data = await res.json();

  console.log("res.status", data);
  console.log("📗 [GoogleBooks] Service - Libro encontrado:", data.volumeInfo?.title);

  return {
    id: data.id,
    title: data.volumeInfo?.title,
    authors: data.volumeInfo?.authors,
    description: data.volumeInfo?.description,
    publishedDate: data.volumeInfo?.publishedDate,
    pageCount: data.volumeInfo?.pageCount, 
    categories: data.volumeInfo?.categories,
    thumbnail: data.volumeInfo?.imageLinks?.thumbnail
    };
}
