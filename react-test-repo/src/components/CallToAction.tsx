"use client";
import { ProbatProviderClient, Experiment } from "@probat/react";
import OriginalComponent from "./CallToAction.original";
import ExperimentVariant from "./CallToAction.experiment";

export default function CallToAction(props: any) {
  return (
    <ProbatProviderClient userId="f3a91e3e-da2b-4b49-a487-8202d07182c0">
      <Experiment
        id="c4e379c6-4e72-43cf-8d66-e6461cbb7531"
        control={<OriginalComponent {...props} />}
        variants={{ experiment: <ExperimentVariant {...props} /> }}
      />
    </ProbatProviderClient>
  );
}
