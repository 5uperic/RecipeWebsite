import { useParams } from "react-router-dom";
import DefaultLayout from "../layouts/DefaultLayout";

export default function RecipeDetail() {
  const { id } = useParams();

  return (
    <DefaultLayout>
      <h1 className="text-2xl font-bold">Recipe #{id}</h1>
      {/* TODO: fetch recipe by id and display details */}
    </DefaultLayout>
  );
}
