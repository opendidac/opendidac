ThisBuild / version := "0.1.0-SNAPSHOT"

ThisBuild / scalaVersion := "3.3.1"

lazy val root = (project in file("."))
  .settings(
    name := "scala3-sbt-warm",
    libraryDependencies := Seq(),
    // Optimize for fast compilation and execution
    scalacOptions ++= Seq(
      "-deprecation",
      "-feature",
      "-unchecked",
      "-Xfatal-warnings"
    ),
    // JVM options for better performance
    javaOptions ++= Seq(
      "-XX:+UseG1GC",
      "-XX:TieredStopAtLevel=1",
      "-Xms64m",
      "-Xmx128m",
      "-XX:ReservedCodeCacheSize=64m"
    ),
    // Optimize for fast startup
    Compile / run / fork := false,
    Compile / run / connectInput := true
  )
