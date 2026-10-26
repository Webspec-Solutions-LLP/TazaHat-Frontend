import Image from "next/image";
import Link from "next/link";
import categoryText from "@/components/category/english.json";
import "@/components/category/Category.css";
import "./AllCategory.css";

export default function AllCategoryPage() {
  return (
    <main className="all-category-page category-section" lang={categoryText.language}>
      <div className="category-container">
        <header className="category-header">
          <div>
            <h1>{categoryText.heading}</h1>
            <p>{categoryText.description}</p>
          </div>
          <Link className="category-view-all" href="/">Back to Home</Link>
        </header>
        <ul className="all-category-grid" aria-label={categoryText.allCategoriesLabel}>
          {categoryText.categories.map((category) => (
            <li key={category.id}>
              <Link className="category-card" href={`/products?category=${encodeURIComponent(category.name)}`} style={{ backgroundColor: category.color }}>
              <div className="category-image">
                <Image src={`${category.image}?v=transparent-2`} unoptimized draggable={false} alt="" fill sizes="(max-width: 600px) 42vw, (max-width: 1023px) 26vw, 190px" />
              </div>
              <div className="category-details">
                <h2>{category.name}</h2>
                <p className="category-count"><strong>{category.types}</strong> {category.types === 1 ? categoryText.productType : categoryText.productTypes}</p>
                <span className="category-arrow" aria-hidden="true">→</span>
              </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
