import Chapters from "@/components/Chapters";
import Intro from "@/components/intro3d/Intro3D";
import TodayWidget from "@/components/onthisday/TodayWidget";
import Slideshow from "@/components/Slideshow";

export default function Home() {
  return (
    <>
      <Intro />
      <Slideshow />
      <TodayWidget />
      <Chapters />
    </>
  );
}
