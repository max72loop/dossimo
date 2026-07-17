import { SeoGuidePage } from "@/components/seo/guide-page";
import { guides } from "@/lib/seo/guides";
import { publicMetadata } from "@/lib/seo/site";

const guide = guides.rge;
export const metadata = publicMetadata({ path: `/${guide.slug}`, title: guide.metaTitle, description: guide.description, type: "article" });
export default function Page() { return <SeoGuidePage guide={guide} />; }
