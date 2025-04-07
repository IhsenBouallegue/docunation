const MAX_ITERATIONS = 100;

/**
 * Compute the Euclidean distance between two vectors.
 */
export function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, idx) => sum + (val - b[idx]) ** 2, 0));
}

/**
 * Seeded random number generator for deterministic results
 */
function seededRandom(initialSeed: number): () => number {
  let seed = initialSeed;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/**
 * Find minimum distance from a point to any of the centroids
 */
function minDistanceToCentroids(point: number[], centroids: number[][]): number {
  if (centroids.length === 0) return Number.POSITIVE_INFINITY;

  let minDist = Number.POSITIVE_INFINITY;
  for (const centroid of centroids) {
    const dist = euclideanDistance(point, centroid);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  return minDist;
}

/**
 * Initialize centroids using K-means++ algorithm with proper distance updating
 */
export function initializeCentroids(data: number[][], k: number, seed = 42): number[][] {
  const getRandom = seededRandom(seed);
  const centroids: number[][] = [];

  // Choose first centroid randomly
  const firstIndex = Math.floor(getRandom() * data.length);
  centroids.push([...data[firstIndex]]);

  // Choose remaining centroids
  for (let i = 1; i < k; i++) {
    // Calculate distances to closest centroid for each point
    const distances = data.map((point) => minDistanceToCentroids(point, centroids));

    // Calculate sum of squared distances
    const distanceSum = distances.reduce((sum, dist) => sum + dist * dist, 0);
    if (distanceSum === 0) {
      // If all points are centroids already, pick randomly
      let newIndex: number;
      do {
        newIndex = Math.floor(getRandom() * data.length);
      } while (centroids.includes(data[newIndex]));
      centroids.push([...data[newIndex]]);
      continue;
    }

    // Choose next centroid based on probability proportional to squared distance
    const random = getRandom() * distanceSum;
    let cumulativeProb = 0;
    let selectedIndex = 0;

    for (let j = 0; j < data.length; j++) {
      cumulativeProb += distances[j] * distances[j];
      if (cumulativeProb >= random) {
        selectedIndex = j;
        break;
      }
    }

    centroids.push([...data[selectedIndex]]);
  }

  return centroids;
}

/**
 * Assign each data point to the nearest centroid.
 */
export function assignClusters(data: number[][], centroids: number[][]): number[] {
  return data.map((point) => {
    let minDistance = Number.POSITIVE_INFINITY;
    let clusterIndex = -1;

    for (const [idx, centroid] of centroids.entries()) {
      const distance = euclideanDistance(point, centroid);
      if (distance < minDistance) {
        minDistance = distance;
        clusterIndex = idx;
      }
    }

    return clusterIndex;
  });
}

/**
 * Update centroids as the mean of points in each cluster.
 * Handles empty clusters by finding the farthest point from any centroid.
 */
export function updateCentroids(data: number[][], assignments: number[], k: number): number[][] {
  const newCentroids: number[][] = Array.from({ length: k }, () => Array(data[0].length).fill(0));
  const counts: number[] = Array(k).fill(0);

  // Sum up all points in each cluster
  for (const [idx, point] of data.entries()) {
    const cluster = assignments[idx];
    counts[cluster] += 1;
    for (let i = 0; i < point.length; i++) {
      newCentroids[cluster][i] += point[i];
    }
  }

  // Calculate average for each cluster
  for (let i = 0; i < k; i++) {
    if (counts[i] > 0) {
      for (let j = 0; j < newCentroids[i].length; j++) {
        newCentroids[i][j] /= counts[i];
      }
    } else {
      // Handle empty cluster by finding the point farthest from any centroid
      let maxDist = -1;
      let farthestPoint = -1;

      for (let j = 0; j < data.length; j++) {
        const dist = minDistanceToCentroids(
          data[j],
          newCentroids.filter((_, idx) => counts[idx] > 0),
        );
        if (dist > maxDist) {
          maxDist = dist;
          farthestPoint = j;
        }
      }

      if (farthestPoint !== -1) {
        newCentroids[i] = [...data[farthestPoint]];
      }
    }
  }

  return newCentroids;
}

/**
 * Runs the KMeans algorithm on the provided data with improved stability.
 *
 * @param data - Array of n-dimensional vectors
 * @param k - Number of clusters to create
 * @param maxIterations - Maximum iterations before stopping
 * @param seed - Random seed for deterministic results
 * @returns Object containing final centroids and cluster assignments
 */
export function kmeans(
  data: number[][],
  k: number,
  maxIterations = MAX_ITERATIONS,
  seed = 42,
): { centroids: number[][]; assignments: number[] } {
  // Handle edge cases
  if (data.length === 0) {
    throw new Error("Empty dataset");
  }
  if (k <= 0 || k > data.length) {
    throw new Error("Invalid number of clusters");
  }

  // Make a copy of the data to avoid modifying the original
  const workingData = data.map((vec) => [...vec]);

  // Initialize centroids using k-means++ algorithm
  let centroids = initializeCentroids(workingData, k, seed);
  let assignments = assignClusters(workingData, centroids);
  let hasConverged = false;

  for (let iter = 0; iter < maxIterations && !hasConverged; iter++) {
    const newCentroids = updateCentroids(workingData, assignments, k);
    const newAssignments = assignClusters(workingData, newCentroids);

    // Check if converged
    hasConverged = newAssignments.every((val, idx) => val === assignments[idx]);
    centroids = newCentroids;
    assignments = newAssignments;
  }

  return { centroids, assignments };
}

/**
 * Helper function to convert kmeans assignments to clusters format
 */
export function assignmentsToClusters(assignments: number[], k: number): number[][] {
  const clusters: number[][] = Array.from({ length: k }, () => []);
  for (const [idx, cluster] of assignments.entries()) {
    clusters[cluster].push(idx);
  }
  return clusters;
}
